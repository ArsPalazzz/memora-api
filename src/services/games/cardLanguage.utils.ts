import {
  CARD_ORIENTATION,
  DEFAULT_BACK_LANGUAGE,
  DEFAULT_FRONT_LANGUAGE,
  LanguageCode,
} from '../cards/card.const';

export type CardDirection = 'front_to_back' | 'back_to_front';

export function resolveDuelDirection(cardOrientation: CARD_ORIENTATION): CardDirection {
  if (cardOrientation === CARD_ORIENTATION.REVERSED) {
    return 'back_to_front';
  }

  return 'front_to_back';
}

export function resolveCardSpeechLanguages(
  direction: CardDirection,
  frontLanguage?: string | null,
  backLanguage?: string | null
): { promptLanguage: LanguageCode; answerLanguage: LanguageCode } {
  const front = (frontLanguage as LanguageCode) || DEFAULT_FRONT_LANGUAGE;
  const back = (backLanguage as LanguageCode) || DEFAULT_BACK_LANGUAGE;

  if (direction === 'front_to_back') {
    return { promptLanguage: front, answerLanguage: back };
  }

  return { promptLanguage: back, answerLanguage: front };
}

export function resolvePromptAndAnswerVariants(
  direction: CardDirection,
  frontVariants: string[],
  backVariants: string[]
): { promptVariants: string[]; answerVariants: string[] } {
  if (direction === 'front_to_back') {
    return { promptVariants: frontVariants, answerVariants: backVariants };
  }

  return { promptVariants: backVariants, answerVariants: frontVariants };
}
