import cardRepository, { CardRepository } from '../../databases/postgre/entities/card/CardRepository';
import challengeRepository, {
  ChallengeRepository,
} from '../../databases/postgre/entities/challenge/ChallengeRepository';
import { NotFoundError } from '../../exceptions';
import { getUtcWeekBounds } from '../users/leagueScore';
import { isDiscoverableDeskVisibility } from '../cards/card.const';

export interface ChallengeLeaderboardEntry {
  rank: number;
  nickname: string;
  isMe: boolean;
  cardsReviewed: number;
  localDeskSub: string;
}

function rankChallengeLeaderboard(
  rows: {
    nickname: string;
    is_me: boolean;
    local_desk_sub: string;
    cards_reviewed: number;
  }[]
): ChallengeLeaderboardEntry[] {
  let rank = 0;
  let previousScore: number | null = null;

  return rows.map((row, index) => {
    if (previousScore !== row.cards_reviewed) {
      rank = index + 1;
      previousScore = row.cards_reviewed;
    }

    return {
      rank,
      nickname: row.nickname,
      isMe: row.is_me,
      cardsReviewed: row.cards_reviewed,
      localDeskSub: row.local_desk_sub,
    };
  });
}

export class ChallengeService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly challengeRepository: ChallengeRepository
  ) {}

  private async resolveChallengeDeskSub(): Promise<string | null> {
    return this.challengeRepository.getAutoWeeklyDeskSub();
  }

  async getChallengeDeskTitle(): Promise<string | null> {
    const deskSub = await this.resolveChallengeDeskSub();
    if (!deskSub) {
      return null;
    }

    const meta = await this.cardRepository.getDeskPublicMeta(deskSub);
    return meta?.title ?? null;
  }

  async getCurrentChallenge(userSub: string) {
    const deskSub = await this.resolveChallengeDeskSub();
    if (!deskSub) {
      throw new NotFoundError('No public desks available for weekly challenge');
    }

    const meta = await this.cardRepository.getDeskPublicMeta(deskSub);
    if (
      !meta ||
      !isDiscoverableDeskVisibility(meta.visibility) ||
      meta.status !== 'active' ||
      meta.is_inbox
    ) {
      throw new NotFoundError('Weekly challenge desk is unavailable');
    }

    const { weekStart, weekEnd } = getUtcWeekBounds();
    const rows = await this.challengeRepository.getLeaderboard(userSub, deskSub);
    const leaderboard = rankChallengeLeaderboard(rows);
    const topFriend = leaderboard.find((entry) => !entry.isMe) ?? null;

    return {
      weekStart,
      weekEnd,
      desk: {
        sub: meta.sub,
        title: meta.title,
        creatorNickname: meta.creator_nickname,
      },
      leaderboard,
      leaderNickname: topFriend?.nickname ?? null,
    };
  }
}

export default new ChallengeService(cardRepository, challengeRepository);
