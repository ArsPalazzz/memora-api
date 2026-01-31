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
  stats: {
    total_cards: number;
    new_cards: number;
    due_today: number;
    mastered_cards: number;
    avg_ease_factor: number;
    weekly_attempts: {
      current: {
        mon: number;
        tue: number;
        wed: number;
        thu: number;
        fri: number;
        sat: number;
        sun: number;
      };
      previous: {
        mon: number;
        tue: number;
        wed: number;
        thu: number;
        fri: number;
        sat: number;
        sun: number;
      };
    };
  };
}

export interface GetDeskCardsResult {
  sub: string;
  createdAt: string;
  frontVariants: string[];
  backVariants: string[];
  examples: string[];
}

export interface Folder {
  sub: string;
  title: string;
  description: string;
  parentFolderSub: string | null;
  createdAt: Date;
  updatedAt: Date;
  deskCount: number;
  childCount: number;
}

export type FolderContentItem = {
  sub: string;
  title: string;
  description: string | null;
  parentFolderSub: string | null;
  createdAt: string;
  type: 'folder' | 'desk';
  totalCards?: number;
  learningCards?: number;
  dueCards?: number;
  newCards?: number;
  masteredCards?: number;
  deskCount: number;
  childCount: number;
  sortTitle: string;
  sortDate: string;
};

export type GetFolderContentsRes = {
  sub: string;
  title: string;
  description: string | null;
  parentFolderSub: string | null;
  createdAt: string;
  type: 'folder' | 'desk';
  totalCards?: number;
  learningCards?: number;
  dueCards?: number;
  newCards?: number;
  masteredCards?: number;
  deskCount: number;
  folderCount: number;
  sortTitle: string;
  sortDate: string;
};

export type FolderInfo = {
  sub: string;
  title: string;
  description: string | null;
  parentFolderSub: string | null;
  createdAt: string;
  deskCount: number;
  childCount: number;
};

export interface FolderTree extends Folder {
  children: FolderTree[];
}

export interface GetRootFoldersRes {
  sub: string;
  title: string;
  description: string;
  deskCount: number;
  folderCount: number;
}
