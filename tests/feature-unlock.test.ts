import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FeatureUnlock, effectivePlan, UNLOCK_KEY } from '../shared/feature-unlock';
import { allowsTransfer, shouldShowAd } from '../shared/plans';

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}
test('incorrect access codes never unlock or persist', () => {
  const storage = memoryStorage();
  const unlock = new FeatureUnlock(storage);
  for (const code of ['', '8888888', '888888888', '12345678', '8888 8888']) assert.equal(unlock.redeem(code), 'invalid');
  assert.equal(unlock.isUnlocked(), false);
  assert.equal(storage.getItem(UNLOCK_KEY), null);
});
test('correct code persists across new page instances without storing the code', () => {
  const storage = memoryStorage();
  assert.equal(new FeatureUnlock(storage).redeem('88888888'), 'saved');
  assert.equal(new FeatureUnlock(storage).isUnlocked(), true);
  assert.notEqual(storage.getItem(UNLOCK_KEY), '88888888');
});
test('code unlock survives billing refresh and grants every supported layout without ads', () => {
  for (const billing of [undefined, 'free', 'plus', 'pro', 'unknown']) {
    const plan = effectivePlan(billing, true);
    for (const lanes of [1, 2, 4, 6]) assert.equal(allowsTransfer(plan, lanes, 60), true);
    assert.equal(shouldShowAd(plan, { transfers: 100, lastShown: 0 }, 999999), false);
  }
  assert.equal(effectivePlan('plus', false), 'plus');
  assert.equal(effectivePlan(undefined, false), 'free');
});
test('unavailable storage permits a clearly reported session unlock', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  for (const storage of [undefined, broken]) {
    const unlock = new FeatureUnlock(storage);
    assert.equal(unlock.isUnlocked(), false);
    assert.equal(unlock.redeem('88888888'), 'session');
    assert.equal(unlock.isUnlocked(), true);
  }
});
