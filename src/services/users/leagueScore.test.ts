import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateWeeklyLeagueScore,
  didLeagueRankWorsen,
  findLeagueOvertaker,
  getUtcWeekBounds,
  rankLeagueParticipants,
} from './leagueScore';

describe('calculateWeeklyLeagueScore', () => {
  it('sums cards, goal bonuses, and streak bonus', () => {
    assert.equal(calculateWeeklyLeagueScore(58, 4, 7), 58 + 4 * 10 + 7 * 2);
    assert.equal(calculateWeeklyLeagueScore(100, 3, 5), 140);
    assert.equal(calculateWeeklyLeagueScore(0, 0, 0), 0);
  });
});

describe('rankLeagueParticipants', () => {
  it('orders by score and assigns competition ranks', () => {
    const ranked = rankLeagueParticipants([
      { nickname: 'alex', isMe: false, cardsReviewed: 20, goalsHit: 1, currentStreak: 3 },
      { nickname: 'me', isMe: true, cardsReviewed: 58, goalsHit: 4, currentStreak: 7 },
      { nickname: 'masha', isMe: false, cardsReviewed: 58, goalsHit: 4, currentStreak: 7 },
    ]);

    assert.deepEqual(
      ranked.map((entry) => [entry.rank, entry.nickname, entry.score]),
      [
        [1, 'masha', 112],
        [1, 'me', 112],
        [3, 'alex', 36],
      ]
    );
  });
});

describe('getUtcWeekBounds', () => {
  it('returns Monday through Sunday in UTC', () => {
    const bounds = getUtcWeekBounds(new Date('2026-07-08T15:30:00.000Z'));
    assert.equal(bounds.weekStart, '2026-07-06');
    assert.equal(bounds.weekEnd, '2026-07-12');
  });
});

describe('findLeagueOvertaker', () => {
  it('returns the closest friend ranked above me', () => {
    const overtaker = findLeagueOvertaker(
      [
        { rank: 1, nickname: 'masha', isMe: false, score: 120, cardsReviewed: 80, goalsHit: 3 },
        { rank: 2, nickname: 'alex', isMe: false, score: 100, cardsReviewed: 70, goalsHit: 2 },
        { rank: 3, nickname: 'me', isMe: true, score: 90, cardsReviewed: 60, goalsHit: 2 },
      ],
      3
    );

    assert.equal(overtaker?.nickname, 'alex');
  });
});

describe('didLeagueRankWorsen', () => {
  it('detects when rank number increases', () => {
    assert.equal(didLeagueRankWorsen(2, 3), true);
    assert.equal(didLeagueRankWorsen(2, 2), false);
    assert.equal(didLeagueRankWorsen(null, 2), false);
  });
});
