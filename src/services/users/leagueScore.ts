export const GOAL_ACHIEVED_BONUS = 10;
export const STREAK_SCORE_MULTIPLIER = 2;

export function calculateWeeklyLeagueScore(
  cardsReviewed: number,
  goalsHit: number,
  currentStreak: number
): number {
  return (
    cardsReviewed + goalsHit * GOAL_ACHIEVED_BONUS + currentStreak * STREAK_SCORE_MULTIPLIER
  );
}

export interface LeagueParticipantInput {
  nickname: string;
  isMe: boolean;
  cardsReviewed: number;
  goalsHit: number;
  currentStreak: number;
}

export interface RankedLeagueParticipant {
  rank: number;
  nickname: string;
  isMe: boolean;
  score: number;
  cardsReviewed: number;
  goalsHit: number;
}

export function rankLeagueParticipants(
  participants: LeagueParticipantInput[]
): RankedLeagueParticipant[] {
  const scored = participants
    .map((participant) => ({
      nickname: participant.nickname,
      isMe: participant.isMe,
      cardsReviewed: participant.cardsReviewed,
      goalsHit: participant.goalsHit,
      score: calculateWeeklyLeagueScore(
        participant.cardsReviewed,
        participant.goalsHit,
        participant.currentStreak
      ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.cardsReviewed - a.cardsReviewed ||
        a.nickname.localeCompare(b.nickname)
    );

  let rank = 0;
  let previousScore: number | null = null;

  return scored.map((participant, index) => {
    if (previousScore !== participant.score) {
      rank = index + 1;
      previousScore = participant.score;
    }

    return {
      rank,
      nickname: participant.nickname,
      isMe: participant.isMe,
      score: participant.score,
      cardsReviewed: participant.cardsReviewed,
      goalsHit: participant.goalsHit,
    };
  });
}

export function getUtcWeekBounds(referenceDate: Date = new Date()): {
  weekStart: string;
  weekEnd: string;
} {
  const utcYear = referenceDate.getUTCFullYear();
  const utcMonth = referenceDate.getUTCMonth();
  const utcDate = referenceDate.getUTCDate();
  const utcDay = referenceDate.getUTCDay();
  const daysFromMonday = (utcDay + 6) % 7;

  const weekStartDate = new Date(Date.UTC(utcYear, utcMonth, utcDate - daysFromMonday));
  const weekEndDate = new Date(Date.UTC(utcYear, utcMonth, utcDate - daysFromMonday + 6));

  return {
    weekStart: formatUtcDate(weekStartDate),
    weekEnd: formatUtcDate(weekEndDate),
  };
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getUtcDateString(referenceDate: Date = new Date()): string {
  return formatUtcDate(referenceDate);
}

export function findLeagueOvertaker(
  participants: RankedLeagueParticipant[],
  myRank: number
): RankedLeagueParticipant | null {
  const friendsAbove = participants.filter(
    (participant) => !participant.isMe && participant.rank < myRank
  );

  if (friendsAbove.length === 0) {
    return null;
  }

  const closestRankAbove = Math.max(...friendsAbove.map((participant) => participant.rank));

  return (
    friendsAbove
      .filter((participant) => participant.rank === closestRankAbove)
      .sort(
        (a, b) =>
          b.score - a.score || a.nickname.localeCompare(b.nickname)
      )[0] ?? null
  );
}

export function didLeagueRankWorsen(previousRank: number | null, currentRank: number): boolean {
  return previousRank != null && currentRank > previousRank;
}
