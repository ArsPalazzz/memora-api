export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function checkAnswerCorrectness(
  answer: string,
  correctVariants: string[]
): boolean {
  const normalizedAnswer = normalizeAnswer(answer);

  return correctVariants.some((variant) => {
    const mainPart = variant.split('(')[0].trim();
    return normalizeAnswer(mainPart) === normalizedAnswer;
  });
}
