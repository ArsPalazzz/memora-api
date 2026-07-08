import Table from '../Table';
import { Query } from '../../index';
import { DuelConfig, DuelAnswerRecord, DuelPlayerRow, DuelRow } from '../../../../services/games/duel/duel.types';
import {
  BEGIN_DUEL_COUNTDOWN,
  CANCEL_DUEL,
  CANCEL_DUELS_BY_DESK,
  IS_DESK_ACTIVE,
  CANCEL_PENDING_DUELS_BETWEEN_PAIR,
  COUNT_CARDS_BY_DESK,
  COUNT_DUEL_PLAYERS,
  DELETE_DUEL_PLAYER,
  EXISTS_DUEL_CODE,
  GET_CARD_SUBS_BY_DESK_FOR_DUEL,
  FINISH_DUEL,
  GET_DUEL_CARDS_BY_SUBS,
  GET_DUEL_BY_CODE,
  GET_DUEL_BY_ID,
  GET_DUEL_PLAYER,
  GET_DUEL_PLAYERS,
  CLEAR_PLAYER_DISCONNECTED,
  GET_DUEL_HISTORY_FOR_USER,
  GET_HEAD_TO_HEAD_OUTCOMES,
  INSERT_DUEL,
  MARK_PLAYER_DISCONNECTED,
  SET_DUEL_STARTED,
  INSERT_DUEL_PLAYER,
  IS_DUEL_PARTICIPANT,
  UPDATE_DUEL_CARDS,
  UPDATE_DUEL_CONFIG,
  UPDATE_DUEL_PLAYER_PLACEMENT,
  UPDATE_DUEL_PLAYER_RACE_STATE,
  UPDATE_DUEL_PLAYER_READY,
  UPDATE_DUEL_STATUS,
} from './DuelRepositoryQueries';

export class DuelRepository extends Table {
  async existsCode(code: string): Promise<boolean> {
    const query: Query = {
      name: 'existsDuelCode',
      text: EXISTS_DUEL_CODE,
      values: [code],
    };

    return this.exists(query);
  }

  async insertDuel(params: {
    id: string;
    code: string;
    hostSub: string;
    deskSub: string;
    config: DuelConfig;
  }) {
    const query: Query = {
      name: 'insertDuel',
      text: INSERT_DUEL,
      values: [params.id, params.code, params.hostSub, params.deskSub, JSON.stringify(params.config)],
    };

    return this.getItem<DuelRow>(query);
  }

  async insertPlayer(params: {
    duelId: string;
    userSub: string;
    slot: number;
    ready?: boolean;
  }) {
    const query: Query = {
      name: 'insertDuelPlayer',
      text: INSERT_DUEL_PLAYER,
      values: [params.duelId, params.userSub, params.slot, params.ready ?? false],
    };

    return this.getItem<DuelPlayerRow>(query);
  }

  async getById(duelId: string) {
    const query: Query = {
      name: 'getDuelById',
      text: GET_DUEL_BY_ID,
      values: [duelId],
    };

    return this.getItem<DuelRow>(query);
  }

  async getByCode(code: string) {
    const query: Query = {
      name: 'getDuelByCode',
      text: GET_DUEL_BY_CODE,
      values: [code.toUpperCase()],
    };

    return this.getItem<DuelRow>(query);
  }

  async getPlayers(duelId: string) {
    const query: Query = {
      name: 'getDuelPlayers',
      text: GET_DUEL_PLAYERS,
      values: [duelId],
    };

    return this.getItems<DuelPlayerRow>(query);
  }

  async countPlayers(duelId: string) {
    const query: Query = {
      name: 'countDuelPlayers',
      text: COUNT_DUEL_PLAYERS,
      values: [duelId],
    };

    const row = await this.getItem<{ count: number }>(query);
    return row?.count ?? 0;
  }

  async getPlayer(duelId: string, userSub: string) {
    const query: Query = {
      name: 'getDuelPlayer',
      text: GET_DUEL_PLAYER,
      values: [duelId, userSub],
    };

    return this.getItem<DuelPlayerRow>(query);
  }

  async isParticipant(duelId: string, userSub: string) {
    const query: Query = {
      name: 'isDuelParticipant',
      text: IS_DUEL_PARTICIPANT,
      values: [duelId, userSub],
    };

    return this.exists(query);
  }

  async updateConfig(duelId: string, config: DuelConfig) {
    const query: Query = {
      name: 'updateDuelConfig',
      text: UPDATE_DUEL_CONFIG,
      values: [duelId, JSON.stringify(config)],
    };

    await this.updateItems(query);
  }

  async updatePlayerReady(duelId: string, userSub: string, ready: boolean) {
    const query: Query = {
      name: 'updateDuelPlayerReady',
      text: UPDATE_DUEL_PLAYER_READY,
      values: [duelId, userSub, ready],
    };

    await this.updateItems(query);
  }

  async updateStatus(duelId: string, status: DuelRow['status']) {
    const query: Query = {
      name: 'updateDuelStatus',
      text: UPDATE_DUEL_STATUS,
      values: [duelId, status],
    };

    await this.updateItems(query);
  }

  async updateCards(duelId: string, cardSeed: number, cardSubs: string[]) {
    const query: Query = {
      name: 'updateDuelCards',
      text: UPDATE_DUEL_CARDS,
      values: [duelId, cardSeed, cardSubs],
    };

    await this.updateItems(query);
  }

  async removePlayer(duelId: string, userSub: string) {
    const query: Query = {
      name: 'deleteDuelPlayer',
      text: DELETE_DUEL_PLAYER,
      values: [duelId, userSub],
    };

    await this.updateItems(query);
  }

  async cancelDuelsByDesk(deskSub: string) {
    const query: Query = {
      name: 'cancelDuelsByDesk',
      text: CANCEL_DUELS_BY_DESK,
      values: [deskSub],
    };

    await this.updateItems(query);
  }

  async isDeskActive(deskSub: string): Promise<boolean> {
    const query: Query = {
      name: 'isDeskActive',
      text: IS_DESK_ACTIVE,
      values: [deskSub],
    };

    const row = await this.getItem<{ exists: boolean }>(query);
    return Boolean(row?.exists);
  }

  async cancelDuel(duelId: string) {
    const query: Query = {
      name: 'cancelDuel',
      text: CANCEL_DUEL,
      values: [duelId],
    };

    await this.updateItems(query);
  }

  async cancelPendingDuelsBetweenPair(userSub: string, friendSub: string) {
    const query: Query = {
      name: 'cancelPendingDuelsBetweenPair',
      text: CANCEL_PENDING_DUELS_BETWEEN_PAIR,
      values: [userSub, friendSub],
    };

    await this.updateItems(query);
  }

  async countCardsByDesk(deskSub: string) {
    const query: Query = {
      name: 'countCardsByDesk',
      text: COUNT_CARDS_BY_DESK,
      values: [deskSub],
    };

    const row = await this.getItem<{ count: number }>(query);
    return row?.count ?? 0;
  }

  async getCardSubsByDesk(deskSub: string) {
    const query: Query = {
      name: 'getCardSubsByDeskForDuel',
      text: GET_CARD_SUBS_BY_DESK_FOR_DUEL,
      values: [deskSub],
    };

    return this.getItems<{ sub: string }>(query);
  }

  async markPlayerDisconnected(duelId: string, userSub: string) {
    const query: Query = {
      name: 'markPlayerDisconnected',
      text: MARK_PLAYER_DISCONNECTED,
      values: [duelId, userSub],
    };

    await this.updateItems(query);
  }

  async clearPlayerDisconnected(duelId: string, userSub: string) {
    const query: Query = {
      name: 'clearPlayerDisconnected',
      text: CLEAR_PLAYER_DISCONNECTED,
      values: [duelId, userSub],
    };

    await this.updateItems(query);
  }

  async beginCountdown(duelId: string) {
    const query: Query = {
      name: 'beginDuelCountdown',
      text: BEGIN_DUEL_COUNTDOWN,
      values: [duelId],
    };

    await this.updateItems(query);
  }

  async setDuelStarted(duelId: string) {
    const query: Query = {
      name: 'setDuelStarted',
      text: SET_DUEL_STARTED,
      values: [duelId],
    };

    await this.updateItems(query);
  }

  async getCardsBySubs(cardSubs: string[]) {
    const query: Query = {
      name: 'getDuelCardsBySubs',
      text: GET_DUEL_CARDS_BY_SUBS,
      values: [cardSubs],
    };

    return this.getItems<{
      sub: string;
      front_variants: string[];
      back_variants: string[];
      image_key: string | null;
    }>(query);
  }

  async updatePlayerRaceState(params: {
    duelId: string;
    userSub: string;
    score: number;
    correctCount: number;
    wrongCount: number;
    totalTimeMs: number;
    maxStreak: number;
    answers: DuelPlayerRow['answers'];
  }) {
    const query: Query = {
      name: 'updateDuelPlayerRaceState',
      text: UPDATE_DUEL_PLAYER_RACE_STATE,
      values: [
        params.duelId,
        params.userSub,
        params.score,
        params.correctCount,
        params.wrongCount,
        params.totalTimeMs,
        params.maxStreak,
        JSON.stringify(params.answers),
      ],
    };

    await this.updateItems(query);
  }

  async updatePlayerPlacement(duelId: string, userSub: string, placement: number) {
    const query: Query = {
      name: 'updateDuelPlayerPlacement',
      text: UPDATE_DUEL_PLAYER_PLACEMENT,
      values: [duelId, userSub, placement],
    };

    await this.updateItems(query);
  }

  async finishDuel(duelId: string) {
    const query: Query = {
      name: 'finishDuel',
      text: FINISH_DUEL,
      values: [duelId],
    };

    await this.updateItems(query);
  }

  async getHeadToHeadOutcomes(userSub: string, friendSub: string) {
    const query: Query = {
      name: 'getHeadToHeadOutcomes',
      text: GET_HEAD_TO_HEAD_OUTCOMES,
      values: [userSub, friendSub],
    };

    return this.getItems<{ placement: number }>(query);
  }

  async getHistoryForUser(userSub: string, limit: number) {
    const query: Query = {
      name: 'getDuelHistoryForUser',
      text: GET_DUEL_HISTORY_FOR_USER,
      values: [userSub, limit],
    };

    return this.getItems<{
      id: string;
      desk_sub: string;
      config: DuelConfig;
      finished_at: string;
      desk_title: string;
      my_placement: number;
      my_score: number;
      my_answers: DuelAnswerRecord[];
      opponent_sub: string | null;
      opponent_placement: number | null;
      opponent_score: number | null;
      opponent_answers: DuelAnswerRecord[] | null;
      opponent_nickname: string | null;
      opponent_avatar_key: string | null;
    }>(query);
  }
}

export default new DuelRepository();
