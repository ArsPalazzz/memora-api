export enum CARD_ORIENTATION {
  NORMAL = 'normal',
  REVERSED = 'reversed',
  MIXED = 'mixed',
}

export const CARDS_PER_SESSION_LIMIT = 200;

export const SUPPORTED_LANGUAGES = [
  'en',
  'ru',
  'de',
  'fr',
  'es',
  'it',
  'pt',
  'ja',
  'zh',
  'ko',
  'uk',
  'pl',
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  ru: 'Russian',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  uk: 'Ukrainian',
  pl: 'Polish',
};

export const DEFAULT_FRONT_LANGUAGE: LanguageCode = 'en';
export const DEFAULT_BACK_LANGUAGE: LanguageCode = 'ru';
export const DEFAULT_EXAMPLE_LANGUAGE: LanguageCode = 'en';

export function isLanguageCode(value: string): value is LanguageCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
