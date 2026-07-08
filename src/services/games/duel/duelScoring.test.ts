import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyAnswerToScoreState,
  calculateCorrectPoints,
  calculateTimePenalty,
  calculateWrongPoints,
  computeHeadToHeadStats,
  computePlacement,
  createInitialScoreState,
  DUEL_CORRECT_MIN_POINTS,
  DUEL_STREAK_MULTIPLIER,
} from './duelScoring';
import { pickCardsForDuel, shuffleWithSeed } from './duelCardPicker';

describe('calculateTimePenalty', () => {
  it('adds 5 points per 500ms capped at 60', () => {
    assert.equal(calculateTimePenalty(0), 0);
    assert.equal(calculateTimePenalty(499), 0);
    assert.equal(calculateTimePenalty(500), 5);
    assert.equal(calculateTimePenalty(2500), 25);
    assert.equal(calculateTimePenalty(7000), 60);
  });
});

describe('calculateCorrectPoints', () => {
  it('never drops below 40 points', () => {
    assert.equal(calculateCorrectPoints(10_000, 1), DUEL_CORRECT_MIN_POINTS);
  });

  it('applies streak multiplier after 3 correct answers', () => {
    const base = calculateCorrectPoints(1000, 2);
    const boosted = calculateCorrectPoints(1000, 3);
    assert.equal(boosted, Math.floor(base * DUEL_STREAK_MULTIPLIER));
  });
});

describe('calculateWrongPoints', () => {
  it('always returns zero', () => {
    assert.equal(calculateWrongPoints(), 0);
  });
});

describe('applyAnswerToScoreState', () => {
  it('tracks streaks, score, and resets on wrong answers', () => {
    let state = createInitialScoreState();

    state = applyAnswerToScoreState(state, { correct: true, durationMs: 1000 });
    state = applyAnswerToScoreState(state, { correct: true, durationMs: 1000 });
    state = applyAnswerToScoreState(state, { correct: true, durationMs: 1000 });
    assert.equal(state.currentStreak, 3);
    assert.equal(state.maxStreak, 3);
    assert.ok(state.score > 0);

    const scoreBeforeWrong = state.score;
    state = applyAnswerToScoreState(state, { correct: false, durationMs: 800 });
    assert.equal(state.score, scoreBeforeWrong);
    assert.equal(state.wrongCount, 1);
    assert.equal(state.currentStreak, 0);
  });
});

describe('computePlacement', () => {
  it('ranks by score then total time and assigns competition ranks', () => {
    const ranked = computePlacement([
      { userSub: 'a', score: 200, totalTimeMs: 5000, correctCount: 10 },
      { userSub: 'b', score: 250, totalTimeMs: 7000, correctCount: 10 },
      { userSub: 'c', score: 250, totalTimeMs: 6000, correctCount: 10 },
    ]);

    assert.deepEqual(
      ranked.map((entry) => [entry.userSub, entry.placement]),
      [
        ['c', 1],
        ['b', 2],
        ['a', 3],
      ]
    );
  });
});

describe('computeHeadToHeadStats', () => {
  it('aggregates wins and losses for both players', () => {
    const stats = computeHeadToHeadStats([
      { userSub: 'a', opponentSub: 'b', placement: 1 },
      { userSub: 'b', opponentSub: 'a', placement: 2 },
      { userSub: 'a', opponentSub: 'b', placement: 2 },
      { userSub: 'b', opponentSub: 'a', placement: 1 },
    ]);

    assert.deepEqual(stats.a, { wins: 1, losses: 1, totalDuels: 2 });
    assert.deepEqual(stats.b, { wins: 1, losses: 1, totalDuels: 2 });
  });
});

describe('pickCardsForDuel', () => {
  it('is deterministic for random pick with the same seed', () => {
    const cards = Array.from({ length: 20 }, (_, index) => `card-${index}`);

    const first = pickCardsForDuel({
      allCardSubs: cards,
      cardCount: 10,
      cardPick: 'random',
      seed: 42,
    });
    const second = pickCardsForDuel({
      allCardSubs: cards,
      cardCount: 10,
      cardPick: 'random',
      seed: 42,
    });

    assert.deepEqual(first, second);
    assert.notDeepEqual(
      first,
      pickCardsForDuel({
        allCardSubs: cards,
        cardCount: 10,
        cardPick: 'random',
        seed: 43,
      })
    );
  });

  it('uses newest cards without shuffling', () => {
    const picked = pickCardsForDuel({
      allCardSubs: ['c', 'b', 'a'],
      cardCount: 2,
      cardPick: 'newest',
      seed: 99,
    });

    assert.deepEqual(picked, ['c', 'b']);
  });
});

describe('shuffleWithSeed', () => {
  it('permutes deterministically', () => {
    const input = [1, 2, 3, 4, 5];
    assert.deepEqual(shuffleWithSeed(input, 7), shuffleWithSeed(input, 7));
    assert.notDeepEqual(shuffleWithSeed(input, 7), input);
  });
});
