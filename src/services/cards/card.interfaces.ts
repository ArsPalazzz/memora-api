import { CARD_ORIENTATION } from './card.const';

export interface GetDeskPayload {
  sub: string;
  desk_sub: string;
}

interface Card {
  sub: string;
  front_variants: string;
  back_variants: string;
  created_at: string;
}

export interface GetDeskDetailsResult {
  sub: string;
  title: string;
  description: string;
  created_at: string;
  cards: Card[];
  settings: {
    cards_per_session: number;
    card_orientation: CARD_ORIENTATION;
  };
}
