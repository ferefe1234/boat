import './qrtransfer.css';
import { android, desktop, saveNative } from './native';
import { allowsTransfer, shouldShowAd, type Plan, type AdHistory } from './plans';
import { FeatureUnlock, effectivePlan, UNLOCK_KEY } from './feature-unlock';

let storage: Storage | undefined;
try { storage = window.localStorage; } catch { /* session-only unlock still works */ }
const unlock = new FeatureUnlock(storage);
let sessionOnlyUnlock = false;

let plan: Plan = 'free';
let active = false;
let startedAt = 0;
let history: AdHistory = { transfers: 0, lastShown: Date.now() };
try { const saved = JSON.parse(localStorage.getItem('qrtransfer:ad-history') || 'null');
  if (saved && Number.isFinite(saved.transfers) && Number.isFinite(saved.lastShown)) history = saved;
} catch { /* storage is optional */ }

const tools = document.createElement('section');
tools.className = 'plan-tools';
tools.innerHTML = `<button type="button" class="secondary-button" id="plans-open">Plans · remove ads</button>
  <dialog class="ad-dialog" aria-labelledby="ad-title">
    <h2 id="ad-title">Advertisement</h2>
    <div class="ad-placeholder">Ad space</div>
    <p>Advertisements may appear here between transfers.</p>
    <button type="button" class="secondary-button">Close ad</button>
  </dialog>
  <dialog class="plans-dialog" aria-labelledby="plans-title">
    <h2 id="plans-title">QRtransfer plans</h2>
    <p>Free: one code, up to 30 fps. All plans can receive compatible streams.</p>
    <div class="plan-card"><h3>Plus · CA$2.99 / month</h3><p>No ads. Two or four codes at up to 60 fps.</p><button type="button" data-product="qrtransfer_plus_monthly">Subscribe to Plus</button></div>
    <div class="plan-card"><h3>Pro · CA$4.99 / month</h3><p>No ads. Up to six codes at 60 fps. Includes Plus features.</p><button type="button" data-product="qrtransfer_pro_monthly">Subscribe to Pro</button></div>
    <p>Frame rates depend on your screen and camera. ${android ? 'Subscriptions renew monthly until cancelled in Google Play. The Play checkout shows your local price and any taxes.' : 'Subscriptions are not available on this platform yet. Free sending and receiving work without an account.'}</p>
    <p class="plan-status" role="status"></p>
    <form id="unlock-form" class="unlock-form">
      <label for="unlock-code">Unlock with a code</label>
      <p>Enter your access code once to unlock all features and remove ads on this device.</p>
      <div class="unlock-controls"><input id="unlock-code" type="password" inputmode="numeric" autocomplete="off" maxlength="8" required aria-describedby="unlock-result" placeholder="8-digit code" /><button type="submit">Unlock</button></div>
      <p id="unlock-result" role="status" aria-live="polite"></p>
    </form>
    <button type="button" class="secondary-button" id="restore-plan">Restore purchases</button>
    <button type="button" class="secondary-button" id="manage-plan">Manage subscription</button>
    <button type="button" class="secondary-button" id="close-plans">Close</button>
  </dialog>`;
document.querySelector('.site-footer')?.before(tools);
const dialog = tools.querySelector<HTMLDialogElement>('.plans-dialog')!;
const status = tools.querySelector<HTMLElement>('.plan-status')!;
const ad = tools.querySelector<HTMLDialogElement>('.ad-dialog')!;
const unlockForm = tools.querySelector<HTMLFormElement>('#unlock-form')!;
const unlockInput = tools.querySelector<HTMLInputElement>('#unlock-code')!;
const unlockResult = tools.querySelector<HTMLElement>('#unlock-result')!;
let adTimer = 0;
function closeAd() { window.clearTimeout(adTimer); if (ad.open) ad.close(); }
function openPlans() { if (!dialog.open) dialog.showModal(); }
tools.querySelector('#plans-open')!.addEventListener('click', openPlans);
tools.querySelector('#close-plans')!.addEventListener('click', () => dialog.close());
tools.querySelector('#restore-plan')!.addEventListener('click', () => android?.restore());
tools.querySelector('#manage-plan')!.addEventListener('click', () => android?.manageSubscriptions());
ad.querySelector('button')!.addEventListener('click', closeAd);
ad.addEventListener('close', () => window.clearTimeout(adTimer));
unlockForm.addEventListener('submit', event => {
  event.preventDefault();
  const result = unlock.redeem(unlockInput.value);
  if (result === 'invalid') {
    unlockResult.textContent = 'That code is not valid. Check it and try again.';
    unlockInput.setAttribute('aria-invalid', 'true');
    return;
  }
  sessionOnlyUnlock = result === 'session';
  unlockInput.value = '';
  unlockInput.removeAttribute('aria-invalid');
  refreshPlan();
});
for (const button of tools.querySelectorAll<HTMLButtonElement>('[data-product]')) {
  button.onclick = () => { status.textContent = 'Opening Google Play…'; android?.purchase(button.dataset.product!); };
}
function refreshPlan() {
  const value = android?.getPlan();
  const unlocked = unlock.isUnlocked();
  plan = effectivePlan(value, unlocked);
  let products: Record<string, string> = {};
  try { products = JSON.parse(android?.getProducts() || '{}'); } catch { /* unavailable */ }
  for (const button of tools.querySelectorAll<HTMLButtonElement>('[data-product]')) {
    const price = products[button.dataset.product!];
    button.disabled = unlocked || !price;
    if (price) button.textContent = `Subscribe · ${price} / month`;
  }
  unlockForm.hidden = unlocked;
  status.textContent = unlocked ? (sessionOnlyUnlock ? 'All features unlocked for this session. Storage is unavailable; enter the code again next time.' : 'All features unlocked on this device. Ads removed.') : plan !== 'free' ? `Current plan: ${plan === 'pro' ? 'Pro' : 'Plus'}. Ads removed.` :
    Object.keys(products).length ? 'Current plan: Free.' : 'Purchases are unavailable in this build. Free transfers work without a subscription.';
  tools.querySelector<HTMLButtonElement>('#restore-plan')!.disabled = !android;
  tools.querySelector<HTMLButtonElement>('#manage-plan')!.disabled = !android;
  tools.querySelector<HTMLButtonElement>('#restore-plan')!.hidden = !android;
  tools.querySelector<HTMLButtonElement>('#manage-plan')!.hidden = !android;
  if (plan !== 'free') closeAd();
  window.dispatchEvent(new Event('qrtransfer:plan-ready'));
}
window.addEventListener('qrtransfer:billing', refreshPlan);
window.addEventListener('storage', event => { if (event.key === UNLOCK_KEY) refreshPlan(); });
window.addEventListener('qrtransfer:billing-message', (event) => { status.textContent = (event as CustomEvent<string>).detail; });
refreshPlan();

export function authorizeTransfer(lanes: number, fps: number): boolean {
  if (allowsTransfer(plan, lanes, fps)) return true;
  openPlans(); return false;
}
export function transferActive(value: boolean, completed = false): void {
  if (value && !active) startedAt = Date.now();
  if (!value && active && (completed || Date.now() - startedAt >= 15_000)) {
    history.transfers++;
    if (!dialog.open && shouldShowAd(plan, history, Date.now())) {
      closeAd();
      ad.showModal(); history = { transfers: 0, lastShown: Date.now() };
      adTimer = window.setTimeout(closeAd, 20_000);
    }
    try { localStorage.setItem('qrtransfer:ad-history', JSON.stringify(history)); } catch { /* optional */ }
  }
  active = value;
  if (value) closeAd();
  android?.setTransferActive(value);
  desktop?.setTransferActive(value);
}
// Android WebView doesn't download blob URLs. Keep the original browser behavior.
if (android) document.addEventListener('click', (event) => {
  const a = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[download]') : null;
  if (!a || !a.href.startsWith('blob:')) return;
  event.preventDefault();
  void fetch(a.href).then(r => r.blob()).then(b => saveNative(b, a.download)).catch(e => alert(String(e)));
});
