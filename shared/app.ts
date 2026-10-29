import './qrtransfer.css';
import { android, desktop, saveNative } from './native';
import { allowsTransfer, shouldShowAd, type Plan, type AdHistory } from './plans';

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
  <aside class="ad-space" aria-label="Advertisement space" hidden><span>Advertisement space · QRtransfer free</span><button type="button">Dismiss</button></aside>
  <dialog class="plans-dialog" aria-labelledby="plans-title">
    <h2 id="plans-title">QRtransfer plans</h2>
    <p>Free: one code, up to 30 fps. All plans can receive compatible streams.</p>
    <div class="plan-card"><h3>Plus · CA$2.99 / month</h3><p>No ads. Two or four codes at up to 60 fps.</p><button type="button" data-product="qrtransfer_plus_monthly">Subscribe to Plus</button></div>
    <div class="plan-card"><h3>Pro · CA$4.99 / month</h3><p>No ads. Up to six codes at 60 fps. Includes Plus features.</p><button type="button" data-product="qrtransfer_pro_monthly">Subscribe to Pro</button></div>
    <p>Frame rates depend on your screen and camera. ${android ? 'Subscriptions renew monthly until cancelled in Google Play. The Play checkout shows your local price and any taxes.' : 'Subscriptions are not available on this platform yet. Free sending and receiving work without an account.'}</p>
    <p class="plan-status" role="status"></p>
    <button type="button" class="secondary-button" id="restore-plan">Restore purchases</button>
    <button type="button" class="secondary-button" id="manage-plan">Manage subscription</button>
    <button type="button" class="secondary-button" id="close-plans">Close</button>
  </dialog>`;
document.querySelector('.site-footer')?.before(tools);
const dialog = tools.querySelector('dialog')!;
const status = tools.querySelector<HTMLElement>('.plan-status')!;
const ad = tools.querySelector<HTMLElement>('.ad-space')!;
function openPlans() { if (!dialog.open) dialog.showModal(); }
tools.querySelector('#plans-open')!.addEventListener('click', openPlans);
tools.querySelector('#close-plans')!.addEventListener('click', () => dialog.close());
tools.querySelector('#restore-plan')!.addEventListener('click', () => android?.restore());
tools.querySelector('#manage-plan')!.addEventListener('click', () => android?.manageSubscriptions());
ad.querySelector('button')!.addEventListener('click', () => { ad.hidden = true; });
for (const button of tools.querySelectorAll<HTMLButtonElement>('[data-product]')) {
  button.onclick = () => { status.textContent = 'Opening Google Play…'; android?.purchase(button.dataset.product!); };
}
function refreshPlan() {
  const value = android?.getPlan();
  plan = value === 'plus' || value === 'pro' ? value : 'free';
  let products: Record<string, string> = {};
  try { products = JSON.parse(android?.getProducts() || '{}'); } catch { /* unavailable */ }
  for (const button of tools.querySelectorAll<HTMLButtonElement>('[data-product]')) {
    const price = products[button.dataset.product!];
    button.disabled = !price;
    if (price) button.textContent = `Subscribe · ${price} / month`;
  }
  status.textContent = plan !== 'free' ? `Current plan: ${plan === 'pro' ? 'Pro' : 'Plus'}. Ads removed.` :
    Object.keys(products).length ? 'Current plan: Free.' : 'Purchases are unavailable in this build. Free transfers work without a subscription.';
  tools.querySelector<HTMLButtonElement>('#restore-plan')!.disabled = !android;
  tools.querySelector<HTMLButtonElement>('#manage-plan')!.disabled = !android;
  tools.querySelector<HTMLButtonElement>('#restore-plan')!.hidden = !android;
  tools.querySelector<HTMLButtonElement>('#manage-plan')!.hidden = !android;
  if (plan !== 'free') ad.hidden = true;
  window.dispatchEvent(new Event('qrtransfer:plan-ready'));
}
window.addEventListener('qrtransfer:billing', refreshPlan);
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
    if (shouldShowAd(plan, history, Date.now())) {
      ad.hidden = false; history = { transfers: 0, lastShown: Date.now() };
      window.setTimeout(() => { ad.hidden = true; }, 20_000);
    }
    try { localStorage.setItem('qrtransfer:ad-history', JSON.stringify(history)); } catch { /* optional */ }
  }
  active = value;
  if (value) ad.hidden = true;
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
