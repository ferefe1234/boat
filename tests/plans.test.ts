import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowsTransfer, shouldShowAd } from '../shared/plans';

test('corrected CAD plans preserve upstream 1/2/4/6 layouts', () => {
  assert.equal(allowsTransfer('free', 1, 30), true);
  assert.equal(allowsTransfer('free', 2, 30), false);
  assert.equal(allowsTransfer('free', 1, 60), false);
  for (const codes of [1, 2, 4]) assert.equal(allowsTransfer('plus', codes, 60), true);
  assert.equal(allowsTransfer('plus', 6, 60), false);
  assert.equal(allowsTransfer('pro', 6, 60), true);
  for (const codes of [0, 3, 5, 7, NaN]) assert.equal(allowsTransfer('pro', codes, 60), false);
  assert.equal(allowsTransfer('pro', 6, 61), false);
});
test('ad spaces require three transfers and five minutes; paid plans never show them', () => {
  assert.equal(shouldShowAd('free', { transfers: 2, lastShown: 0 }, 600_000), false);
  assert.equal(shouldShowAd('free', { transfers: 3, lastShown: 1 }, 300_000), false);
  assert.equal(shouldShowAd('free', { transfers: 3, lastShown: 0 }, 300_000), true);
  for (const plan of ['plus', 'pro'] as const)
    assert.equal(shouldShowAd(plan, { transfers: 10, lastShown: 0 }, 600_000), false);
});
