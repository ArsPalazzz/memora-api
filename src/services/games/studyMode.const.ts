export const STUDY_MODES = ['write', 'reveal', 'match', 'swipe'] as const;

export type StudyMode = (typeof STUDY_MODES)[number];

export const DEFAULT_DESK_STUDY_MODE: StudyMode = 'write';
export const DEFAULT_REVIEW_STUDY_MODE: StudyMode = 'write';
export const DEFAULT_FEED_STUDY_MODE: StudyMode = 'write';

export function normalizeFeedStudyMode(mode: StudyMode | null | undefined): StudyMode {
  return mode === 'reveal' ? 'reveal' : 'write';
}

export function isStudyMode(value: string): value is StudyMode {
  return (STUDY_MODES as readonly string[]).includes(value);
}
