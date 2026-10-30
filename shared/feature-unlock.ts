import type { Plan } from './plans';

export const UNLOCK_KEY = 'qrtransfer:feature-unlock';
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;

/** Offline, per-installation access code. This is not a payment receipt. */
export class FeatureUnlock {
  private sessionUnlocked = false;
  constructor(private storage?: StorageAccess) {}
  isUnlocked(): boolean {
    if (this.sessionUnlocked) return true;
    try { return this.storage?.getItem(UNLOCK_KEY) === 'v2'; }
    catch { return false; }
  }
  redeem(code: string): 'invalid' | 'saved' | 'session' {
    if (code.trim() !== '88888888') return 'invalid';
    this.sessionUnlocked = true;
    try {
      if (!this.storage) return 'session';
      this.storage.setItem(UNLOCK_KEY, 'v2');
      return 'saved';
    } catch { return 'session'; }
  }
}

export function effectivePlan(billingPlan: string | undefined, unlocked: boolean): Plan {
  if (unlocked) return 'pro';
  return billingPlan === 'plus' || billingPlan === 'pro' ? billingPlan : 'free';
}
