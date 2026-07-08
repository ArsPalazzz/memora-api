import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DuelRateLimiter } from './DuelRateLimiter';

describe('DuelRateLimiter', () => {
  it('blocks bursts above the configured limit', () => {
    const limiter = new DuelRateLimiter();
    const key = 'duel:player';

    for (let index = 0; index < 10; index += 1) {
      assert.equal(limiter.allow(key, 10, 1000), true);
    }

    assert.equal(limiter.allow(key, 10, 1000), false);
  });
});
