export type Plan = 'free' | 'plus' | 'pro';
export function laneLimit(plan: Plan): number { return plan === 'pro' ? 6 : plan === 'plus' ? 4 : 1; }
export function allowsTransfer(plan: Plan, lanes: number, fps: number): boolean {
  return Number.isInteger(lanes) && [1, 2, 4, 6].includes(lanes) && lanes <= laneLimit(plan) &&
    Number.isFinite(fps) && fps > 0 && fps <= (plan === 'free' ? 30 : 60);
}
export interface AdHistory { transfers: number; lastShown: number; }
export function shouldShowAd(plan: Plan, history: AdHistory, now: number): boolean {
  return plan === 'free' && history.transfers >= 3 && now - history.lastShown >= 300_000;
}
