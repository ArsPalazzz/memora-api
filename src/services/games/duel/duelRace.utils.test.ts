import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getExpectedCardIndex,
  isRaceComplete,
  validateAdvanceRequest,
  DUEL_MIN_ANSWER_DURATION_MS,
} from './duelRace.utils';
import { DuelAnswerRecord } from './duel.types';

describe('validateAdvanceRequest', () => {
  it('rejects answers that are too fast', () => {
    const result = validateAdvanceRequest({
      cardIndex: 0,
      durationMs: DUEL_MIN_ANSWER_DURATION_MS - 1,
      expectedIndex: 0,
    });

    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.match(result.reason, /too quickly/i);
    }
  });

  it('rejects out-of-order card indexes', () => {
    const result = validateAdvanceRequest({
      cardIndex: 2,
      durationMs: 1000,
      expectedIndex: 1,
    });

    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.match(result.reason, /out of order/i);
    }
  });

  it('accepts the next sequential card', () => {
    const result = validateAdvanceRequest({
      cardIndex: 1,
      durationMs: 1000,
      expectedIndex: 1,
    });

    assert.equal(result.valid, true);
  });
});

describe('getExpectedCardIndex', () => {
  it('returns the number of existing answers', () => {
    const answers: DuelAnswerRecord[] = [
      {
        cardIndex: 0,
        cardSub: 'a',
        answer: 'one',
        correct: true,
        durationMs: 900,
      },
    ];

    assert.equal(getExpectedCardIndex(answers), 1);
  });
});

describe('isRaceComplete', () => {
  it('detects when all cards are answered', () => {
    assert.equal(isRaceComplete(5, 5), true);
    assert.equal(isRaceComplete(4, 5), false);
  });
});
