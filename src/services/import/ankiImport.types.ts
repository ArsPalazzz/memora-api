import { LanguageCode } from '../cards/card.const';

export type DeskImportStrategy = 'merge' | 'skip' | 'replace' | 'rename';

export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ParsedAnkiCardPayload {
  front: string[];
  back: string[];
  examples: string[];
}

export interface ParsedAnkiDeskPayload {
  clientId: string;
  title: string;
  tags: string;
  folderPath: string[];
  fieldNames: string[];
  frontField: string;
  backField: string;
  exampleFields: string[];
  cards: ParsedAnkiCardPayload[];
}

export interface ImportDeskRequest extends ParsedAnkiDeskPayload {
  strategy?: DeskImportStrategy;
  renameTitle?: string;
}

export interface ImportJobPayload {
  defaultStrategy: DeskImportStrategy;
  languageSettings: {
    front_language: LanguageCode;
    back_language: LanguageCode;
    example_language: LanguageCode;
  };
  desks: ImportDeskRequest[];
}

export interface ImportPreviewDeskResult {
  clientId: string;
  title: string;
  tags: string;
  folderPath: string[];
  fieldNames: string[];
  frontField: string;
  backField: string;
  exampleFields: string[];
  cardCount: number;
  exampleCount: number;
  conflict: boolean;
  existingDeskSub: string | null;
  existingLocationLabel: string | null;
  estimatedNewCards: number;
  estimatedDuplicateCards: number;
}

export interface ImportPreviewResult {
  desks: ImportPreviewDeskResult[];
  totalCards: number;
}

export interface ImportJobDeskResult {
  clientId: string;
  title: string;
  deskSub: string | null;
  strategy: DeskImportStrategy;
  created: boolean;
  skipped: boolean;
  cardsAdded: number;
  cardsSkipped: number;
  examplesAdded: number;
}

export interface ImportJobResult {
  desks: ImportJobDeskResult[];
  summary: {
    desksCreated: number;
    desksMerged: number;
    desksSkipped: number;
    cardsAdded: number;
    cardsSkipped: number;
    examplesAdded: number;
  };
}

export interface ImportJobStatusResponse {
  sub: string;
  status: ImportJobStatus;
  progress: number;
  total: number;
  result: ImportJobResult | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
