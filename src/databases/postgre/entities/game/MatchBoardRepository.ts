import Table from '../Table';
import { Query } from '../../index';
import {
  GET_MATCH_BOARD_SLOTS,
  GET_MATCH_CARD_FOR_GRADE,
  GET_SESSION_CARDS_FOR_MATCH,
  HAS_MATCH_SUBMIT,
  HAS_UNGRADED_MATCH_CARDS,
  INSERT_MATCH_BOARD_SLOT,
  SAVE_MATCH_RESULTS,
  SET_MATCH_CARD_QUALITY,
} from './MatchBoardRepositoryQueries';

export interface MatchSessionCardRow {
  sessionCardId: number;
  cardSub: string;
  direction: string;
  answeredAt: Date | null;
  isCorrect: boolean | null;
  frontVariants: string[];
  backVariants: string[];
}

export interface MatchBoardSlotRow {
  slotId: number;
  cardSub: string;
  slotText: string;
}

export class MatchBoardRepository extends Table {
  async getSessionCardsForMatch(sessionId: string, userSub: string) {
    const query: Query = {
      name: 'getSessionCardsForMatch',
      text: GET_SESSION_CARDS_FOR_MATCH,
      values: [sessionId, userSub],
    };

    return this.getItems<MatchSessionCardRow>(query);
  }

  async getBoardSlots(sessionId: string) {
    const query: Query = {
      name: 'getMatchBoardSlots',
      text: GET_MATCH_BOARD_SLOTS,
      values: [sessionId],
    };

    return this.getItems<MatchBoardSlotRow>(query);
  }

  async insertBoardSlot(params: {
    sessionId: string;
    slotId: number;
    cardSub: string;
    slotText: string;
  }) {
    const query: Query = {
      name: 'insertMatchBoardSlot',
      text: INSERT_MATCH_BOARD_SLOT,
      values: [params.sessionId, params.slotId, params.cardSub, params.slotText],
    };

    await this.insertItem(query);
  }

  async hasMatchSubmit(sessionId: string) {
    const query: Query = {
      name: 'hasMatchSubmit',
      text: HAS_MATCH_SUBMIT,
      values: [sessionId],
    };

    return this.exists(query);
  }

  async saveMatchResults(params: {
    sessionId: string;
    cardSubs: string[];
    isCorrectFlags: boolean[];
    slotIds: number[];
  }) {
    const query: Query = {
      name: 'saveMatchResults',
      text: SAVE_MATCH_RESULTS,
      values: [params.sessionId, params.cardSubs, params.isCorrectFlags, params.slotIds],
    };

    await this.updateItems(query);
  }

  async getMatchCardForGrade(sessionId: string, cardSub: string) {
    const query: Query = {
      name: 'getMatchCardForGrade',
      text: GET_MATCH_CARD_FOR_GRADE,
      values: [sessionId, cardSub],
    };

    return this.getItem<{ cardSub: string }>(query);
  }

  async setMatchCardQuality(sessionId: string, cardSub: string, quality: number) {
    const query: Query = {
      name: 'setMatchCardQuality',
      text: SET_MATCH_CARD_QUALITY,
      values: [sessionId, cardSub, quality],
    };

    await this.updateItems(query);
  }

  async hasUngradedMatchCards(sessionId: string) {
    const query: Query = {
      name: 'hasUngradedMatchCards',
      text: HAS_UNGRADED_MATCH_CARDS,
      values: [sessionId],
    };

    return this.exists(query);
  }
}

export default new MatchBoardRepository();
