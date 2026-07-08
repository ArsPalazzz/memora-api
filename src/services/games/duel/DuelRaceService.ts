import duelRepository, { DuelRepository } from '../../../databases/postgre/entities/game/DuelRepository';
import deskSettingsRepository, {
  DeskSettingsRepository,
} from '../../../databases/postgre/entities/card/DeskSettingsRepository';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../../exceptions';
import { mapAvatarUrl } from '../../../utils/avatarUrl';
import { mapCardImageUrl } from '../../../utils/cardImageUrl';
import { checkAnswerCorrectness } from '../../../utils/answerGrading';
import {
  resolveCardSpeechLanguages,
  resolveDuelDirection,
  resolvePromptAndAnswerVariants,
} from '../cardLanguage.utils';
import { CARD_ORIENTATION } from '../../cards/card.const';
import duelRateLimiter, { DuelRateLimiter } from './DuelRateLimiter';
import duelRacePayloadCache, { DuelRacePayloadCache } from './DuelRacePayloadCache';
import {
  getExpectedCardIndex,
  isRaceComplete,
  validateAdvanceRequest,
} from './duelRace.utils';
import {
  applyAnswerToScoreState,
  computePlacement,
  createInitialScoreState,
} from './duelScoring';
import {
  DuelAnswerRecord,
  DuelPlayerRow,
  DuelRaceCard,
  DuelRaceFinishedResults,
  DuelRaceProgress,
  DuelRacePayload,
  DuelRaceRejoinState,
} from './duel.types';
import { logDuelLifecycle } from './duelLifecycleLog';
import { publishDuelRaceFinished } from './DuelEventBridge';

export class DuelRaceService {
  constructor(
    private readonly duelRepository: DuelRepository,
    private readonly deskSettingsRepository: DeskSettingsRepository,
    private readonly payloadCache: DuelRacePayloadCache,
    private readonly rateLimiter: DuelRateLimiter
  ) {}

  async buildAndCacheRacePayload(duelId: string): Promise<DuelRacePayload> {
    const cached = this.payloadCache.get(duelId);
    if (cached) {
      return cached;
    }

    const payload = await this.buildRacePayload(duelId);
    this.payloadCache.set(duelId, payload);
    return payload;
  }

  async getRacePayload(duelId: string, viewerSub: string): Promise<DuelRacePayload> {
    await this.assertParticipant(duelId, viewerSub);
    const duel = await this.getDuelOrThrow(duelId);

    if (duel.status !== 'racing' && duel.status !== 'finished') {
      throw new ConflictError('Race payload is available only during or after the race');
    }

    if (!duel.card_subs?.length) {
      throw new BadRequestError('Race cards are not assigned');
    }

    const payload = await this.buildAndCacheRacePayload(duelId);
    return this.sanitizePayloadForClient(this.personalizePayload(payload, viewerSub));
  }

  async getFinishedResults(duelId: string, viewerSub: string): Promise<DuelRaceFinishedResults> {
    await this.assertParticipant(duelId, viewerSub);
    const duel = await this.getDuelOrThrow(duelId);

    if (duel.status !== 'finished') {
      throw new ConflictError('Results are available only after the duel finishes');
    }

    return this.buildFinishedResults(duelId);
  }

  async getWrongCardSubs(duelId: string, userSub: string): Promise<string[]> {
    await this.assertParticipant(duelId, userSub);
    const player = await this.duelRepository.getPlayer(duelId, userSub);

    if (!player) {
      throw new NotFoundError('Player not found in duel');
    }

    return player.answers.filter((answer) => !answer.correct).map((answer) => answer.cardSub);
  }

  async advance(params: {
    duelId: string;
    userSub: string;
    cardIndex: number;
    answer: string;
    durationMs: number;
    clientTimestamp?: number;
  }): Promise<{
    progress: DuelRaceProgress;
    finished: boolean;
    results?: DuelRaceFinishedResults;
    correct: boolean;
    duplicate: boolean;
  }> {
    const { duelId, userSub, cardIndex, answer, durationMs } = params;

    if (!this.rateLimiter.allow(`${duelId}:${userSub}`)) {
      throw new ConflictError('Too many race events, slow down');
    }

    const duel = await this.getDuelOrThrow(duelId);
    if (duel.status !== 'racing') {
      throw new ConflictError('Duel is not in racing status');
    }

    await this.assertParticipant(duelId, userSub);

    const player = await this.duelRepository.getPlayer(duelId, userSub);
    if (!player) {
      throw new NotFoundError('Player not found in duel');
    }

    const expectedIndex = getExpectedCardIndex(player.answers);
    const existingAnswer = player.answers.find((entry) => entry.cardIndex === cardIndex);

    if (existingAnswer) {
      const progress = this.buildProgressFromPlayer(player, cardIndex);
      const cardCount = duel.config.cardCount;
      const playerFinished = isRaceComplete(player.answers.length, cardCount);
      const results = playerFinished ? await this.tryFinishDuel(duelId) : undefined;

      return {
        progress,
        finished: Boolean(results),
        results: results ?? undefined,
        correct: existingAnswer.correct,
        duplicate: true,
      };
    }

    const validation = validateAdvanceRequest({ cardIndex, durationMs, expectedIndex });
    if (!validation.valid) {
      throw new BadRequestError(validation.reason);
    }

    const payload = await this.buildAndCacheRacePayload(duelId);
    const card = payload.cards[cardIndex];
    if (!card) {
      throw new BadRequestError('Invalid card index');
    }

    const correct = checkAnswerCorrectness(answer, card.backVariants ?? []);
    const scoreState = applyAnswerToScoreState(this.playerToScoreState(player), {
      correct,
      durationMs,
    });

    const answerRecord: DuelAnswerRecord = {
      cardIndex,
      cardSub: card.sub,
      answer,
      correct,
      durationMs,
    };

    const answers = [...player.answers, answerRecord];

    await this.duelRepository.updatePlayerRaceState({
      duelId,
      userSub,
      score: scoreState.score,
      correctCount: scoreState.correctCount,
      wrongCount: scoreState.wrongCount,
      totalTimeMs: scoreState.totalTimeMs,
      maxStreak: scoreState.maxStreak,
      answers,
    });

    const progress: DuelRaceProgress = {
      userSub,
      cardIndex,
      score: scoreState.score,
      correctCount: scoreState.correctCount,
      streak: scoreState.currentStreak,
      totalTimeMs: scoreState.totalTimeMs,
    };

    const cardCount = duel.config.cardCount;
    const playerFinished = isRaceComplete(answers.length, cardCount);

    if (!playerFinished) {
      return { progress, finished: false, correct, duplicate: false };
    }

    const results = await this.tryFinishDuel(duelId);
    return {
      progress,
      finished: Boolean(results),
      results: results ?? undefined,
      correct,
      duplicate: false,
    };
  }

  async forfeit(duelId: string, userSub: string): Promise<DuelRaceFinishedResults> {
    const duel = await this.getDuelOrThrow(duelId);
    if (duel.status !== 'racing') {
      throw new ConflictError('Duel is not in racing status');
    }

    await this.assertParticipant(duelId, userSub);

    const player = await this.duelRepository.getPlayer(duelId, userSub);
    if (!player) {
      throw new NotFoundError('Player not found in duel');
    }

    if (isRaceComplete(player.answers.length, duel.config.cardCount)) {
      throw new ConflictError('Race already completed for this player');
    }

    const results = await this.tryFinishDuel(duelId, userSub);
    if (!results) {
      throw new Error('Failed to finish duel after forfeit');
    }

    logDuelLifecycle('duel.forfeit', { duelId, userSub });
    return results;
  }

  async forfeitDueToDisconnect(duelId: string, userSub: string): Promise<DuelRaceFinishedResults | null> {
    const duel = await this.getDuelOrThrow(duelId);
    if (duel.status !== 'racing') {
      return null;
    }

    return this.tryFinishDuel(duelId, userSub);
  }

  async getRejoinState(duelId: string, userSub: string): Promise<DuelRaceRejoinState> {
    await this.assertParticipant(duelId, userSub);

    const duel = await this.getDuelOrThrow(duelId);
    const players = await this.duelRepository.getPlayers(duelId);
    const me = players.find((player) => player.user_sub === userSub);

    if (!me) {
      throw new NotFoundError('Player not found in duel');
    }

    const opponents = players
      .filter((player) => player.user_sub !== userSub)
      .map((player) => this.toOpponentProgress(player));

    const baseState: DuelRaceRejoinState = {
      phase: duel.status === 'countdown' ? 'countdown' : duel.status === 'finished' ? 'finished' : 'racing',
      duelId,
      myIndex: getExpectedCardIndex(me.answers),
      cardCount: duel.config.cardCount,
      myProgress: {
        score: me.score,
        correctCount: me.correct_count,
        wrongCount: me.wrong_count,
        streak: this.getCurrentStreak(me.answers),
        totalTimeMs: me.total_time_ms,
      },
      opponents,
    };

    if (duel.status === 'racing') {
      const fullPayload = await this.buildAndCacheRacePayload(duelId);
      baseState.payload = this.sanitizePayloadForClient(
        this.personalizePayload(fullPayload, userSub)
      );
    }

    if (duel.status === 'finished') {
      baseState.results = await this.buildFinishedResults(duelId);
    }

    return baseState;
  }

  private async buildRacePayload(duelId: string): Promise<DuelRacePayload> {
    const duel = await this.getDuelOrThrow(duelId);
    const players = await this.duelRepository.getPlayers(duelId);

    if (!duel.card_subs?.length) {
      throw new BadRequestError('Race cards are not assigned');
    }

    const deskSettings = await this.deskSettingsRepository.getByDeskSub(duel.desk_sub);
    const direction = resolveDuelDirection(
      deskSettings?.card_orientation ?? CARD_ORIENTATION.NORMAL
    );
    const speechLanguages = resolveCardSpeechLanguages(
      direction,
      deskSettings?.front_language,
      deskSettings?.back_language
    );

    const cardRows = await this.duelRepository.getCardsBySubs(duel.card_subs);
    const cards = cardRows.map((row, index) => {
      const { promptVariants, answerVariants } = resolvePromptAndAnswerVariants(
        direction,
        row.front_variants,
        row.back_variants
      );
      const withImage = mapCardImageUrl({ image_key: row.image_key });

      return {
        index,
        sub: row.sub,
        text: promptVariants,
        backVariants: answerVariants,
        image_url: withImage.image_url,
        promptLanguage: speechLanguages.promptLanguage,
        answerLanguage: speechLanguages.answerLanguage,
      };
    });

    const opponents = players.map((player) => {
      const withAvatar = mapAvatarUrl({
        sub: player.user_sub,
        nickname: player.nickname ?? 'User',
        avatar_key: player.avatar_key ?? null,
      });

      return {
        sub: player.user_sub,
        nickname: withAvatar.nickname,
        avatar_url: withAvatar.avatar_url,
      };
    });

    return {
      duelId,
      startedAt: duel.started_at ? new Date(duel.started_at).getTime() : Date.now(),
      config: duel.config,
      opponents,
      cards,
    };
  }

  private async tryFinishDuel(
    duelId: string,
    forfeitedUserSub?: string
  ): Promise<DuelRaceFinishedResults | null> {
    const duel = await this.getDuelOrThrow(duelId);
    if (duel.status === 'finished') {
      return this.buildFinishedResults(duelId);
    }

    const players = await this.duelRepository.getPlayers(duelId);
    const cardCount = duel.config.cardCount;

    if (forfeitedUserSub) {
      return this.finalizeDuel(duelId, players, forfeitedUserSub);
    }

    const allDone = players.every((player) => isRaceComplete(player.answers.length, cardCount));
    if (!allDone) {
      return null;
    }

    return this.finalizeDuel(duelId, players);
  }

  private async finalizeDuel(
    duelId: string,
    players: DuelPlayerRow[],
    forfeitedUserSub?: string
  ): Promise<DuelRaceFinishedResults> {
    let ranked;

    if (forfeitedUserSub) {
      const activePlayers = players.filter((player) => player.user_sub !== forfeitedUserSub);
      const activeRanked = computePlacement(
        activePlayers.map((player) => ({
          userSub: player.user_sub,
          score: player.score,
          totalTimeMs: player.total_time_ms,
          correctCount: player.correct_count,
        }))
      );

      const forfeiter = players.find((player) => player.user_sub === forfeitedUserSub);
      ranked = [
        ...activeRanked,
        {
          userSub: forfeitedUserSub,
          score: forfeiter?.score ?? 0,
          totalTimeMs: forfeiter?.total_time_ms ?? 0,
          correctCount: forfeiter?.correct_count ?? 0,
          placement: players.length,
        },
      ];
    } else {
      ranked = computePlacement(
        players.map((player) => ({
          userSub: player.user_sub,
          score: player.score,
          totalTimeMs: player.total_time_ms,
          correctCount: player.correct_count,
        }))
      );
    }

    await this.duelRepository.finishDuel(duelId);

    for (const entry of ranked) {
      await this.duelRepository.updatePlayerPlacement(duelId, entry.userSub, entry.placement);
    }

    const results = await this.buildFinishedResults(duelId);
    logDuelLifecycle('duel.finished', {
      duelId,
      forfeitedUserSub: forfeitedUserSub ?? null,
      playerCount: players.length,
    });
    publishDuelRaceFinished(duelId, results);
    return results;
  }

  private async buildFinishedResults(duelId: string): Promise<DuelRaceFinishedResults> {
    const players = await this.duelRepository.getPlayers(duelId);

    const scoreboard = players
      .map((player) => {
        const withAvatar = mapAvatarUrl({
          sub: player.user_sub,
          nickname: player.nickname ?? 'User',
          avatar_key: player.avatar_key ?? null,
        });

        return {
          sub: player.user_sub,
          nickname: withAvatar.nickname,
          avatar_url: withAvatar.avatar_url,
          placement: player.placement ?? 0,
          score: player.score,
          correctCount: player.correct_count,
          wrongCount: player.wrong_count,
          totalTimeMs: player.total_time_ms,
          maxStreak: player.max_streak,
        };
      })
      .sort((a, b) => a.placement - b.placement);

    const cardByCardMap = new Map<number, DuelRaceFinishedResults['cardByCard'][number]>();

    for (const player of players) {
      for (const answer of player.answers) {
        const existing = cardByCardMap.get(answer.cardIndex) ?? {
          cardIndex: answer.cardIndex,
          cardSub: answer.cardSub,
          prompt: [] as string[],
          players: {},
        };

        existing.players[player.user_sub] = {
          answer: answer.answer,
          correct: answer.correct,
          durationMs: answer.durationMs,
        };

        cardByCardMap.set(answer.cardIndex, existing);
      }
    }

    const cardByCard = Array.from(cardByCardMap.values()).sort((a, b) => a.cardIndex - b.cardIndex);

    const cardSubs = cardByCard.map((entry) => entry.cardSub);
    const promptBySub = new Map<string, string[]>();

    if (cardSubs.length > 0) {
      const duel = await this.getDuelOrThrow(duelId);
      const deskSettings = await this.deskSettingsRepository.getByDeskSub(duel.desk_sub);
      const direction = resolveDuelDirection(
        deskSettings?.card_orientation ?? CARD_ORIENTATION.NORMAL
      );
      const cardRows = await this.duelRepository.getCardsBySubs(cardSubs);

      for (const row of cardRows) {
        const { promptVariants } = resolvePromptAndAnswerVariants(
          direction,
          row.front_variants,
          row.back_variants
        );
        promptBySub.set(row.sub, promptVariants);
      }
    }

    const cardByCardWithPrompts = cardByCard.map((entry) => ({
      ...entry,
      prompt: promptBySub.get(entry.cardSub) ?? [],
    }));

    return {
      scoreboard,
      cardByCard: cardByCardWithPrompts,
    };
  }

  private toOpponentProgress(player: DuelPlayerRow) {
    const withAvatar = mapAvatarUrl({
      sub: player.user_sub,
      nickname: player.nickname ?? 'User',
      avatar_key: player.avatar_key ?? null,
    });

    return {
      sub: player.user_sub,
      nickname: withAvatar.nickname,
      avatar_url: withAvatar.avatar_url,
      cardIndex: getExpectedCardIndex(player.answers),
      score: player.score,
      correctCount: player.correct_count,
      wrongCount: player.wrong_count,
      streak: this.getCurrentStreak(player.answers),
      totalTimeMs: player.total_time_ms,
      disconnectedAt: player.disconnected_at,
    };
  }

  private playerToScoreState(player: DuelPlayerRow) {
    const state = createInitialScoreState();
    let current = state;

    for (const answer of player.answers) {
      current = applyAnswerToScoreState(current, {
        correct: answer.correct,
        durationMs: answer.durationMs,
      });
    }

    return current;
  }

  private getCurrentStreak(answers: DuelAnswerRecord[]): number {
    let streak = 0;

    for (let index = answers.length - 1; index >= 0; index -= 1) {
      if (!answers[index].correct) {
        break;
      }
      streak += 1;
    }

    return streak;
  }

  private buildProgressFromPlayer(player: DuelPlayerRow, cardIndex: number): DuelRaceProgress {
    return {
      userSub: player.user_sub,
      cardIndex,
      score: player.score,
      correctCount: player.correct_count,
      streak: this.getCurrentStreak(player.answers),
      totalTimeMs: player.total_time_ms,
    };
  }

  private sanitizePayloadForClient(payload: DuelRacePayload): DuelRacePayload {
    return {
      ...payload,
      cards: payload.cards.map((card) => {
        const { backVariants: _backVariants, ...clientCard } = card;
        return clientCard as DuelRaceCard;
      }),
    };
  }

  private personalizePayload(payload: DuelRacePayload, viewerSub: string): DuelRacePayload {
    return {
      ...payload,
      opponents: payload.opponents.filter((opponent) => opponent.sub !== viewerSub),
    };
  }

  private async getDuelOrThrow(duelId: string) {
    const duel = await this.duelRepository.getById(duelId);
    if (!duel) {
      throw new NotFoundError('Duel not found');
    }

    return duel;
  }

  private async assertParticipant(duelId: string, userSub: string) {
    const isParticipant = await this.duelRepository.isParticipant(duelId, userSub);
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this duel');
    }
  }
}

export default new DuelRaceService(
  duelRepository,
  deskSettingsRepository,
  duelRacePayloadCache,
  duelRateLimiter
);
