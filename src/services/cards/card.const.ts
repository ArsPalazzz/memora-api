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

export const INBOX_DESK_TITLE = 'Inbox';
export const INBOX_DESK_DESCRIPTION = 'Saved from Discover feed';

export type DeskVisibility = 'private' | 'public' | 'friends' | 'unlisted';

export const DESK_VISIBILITY = {
  PRIVATE: 'private',
  PUBLIC: 'public',
  FRIENDS: 'friends',
  UNLISTED: 'unlisted',
} as const;

export const DESK_VISIBILITY_VALUES: DeskVisibility[] = [
  'private',
  'public',
  'friends',
  'unlisted',
];

export function isDiscoverableDeskVisibility(visibility: string): boolean {
  return visibility === DESK_VISIBILITY.PUBLIC;
}

export function canViewDeskVisibility(
  visibility: DeskVisibility,
  options: { isOwner: boolean; isFriend: boolean }
): boolean {
  if (options.isOwner) return true;
  if (visibility === DESK_VISIBILITY.PRIVATE) return false;
  if (visibility === DESK_VISIBILITY.PUBLIC) return true;
  if (visibility === DESK_VISIBILITY.FRIENDS) return options.isFriend;
  return false;
}

export function canAddDeskToLibrary(
  visibility: DeskVisibility,
  options: { isFriend: boolean }
): boolean {
  if (visibility === DESK_VISIBILITY.PUBLIC) return true;
  if (visibility === DESK_VISIBILITY.FRIENDS) return options.isFriend;
  return false;
}

export function visibilityToLegacyPublic(visibility: DeskVisibility): boolean {
  return visibility === DESK_VISIBILITY.PUBLIC;
}

export function isLanguageCode(value: string): value is LanguageCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
