export const DELETE_CARD_EXAMPLES = `
  DELETE FROM cards.card_examples
  WHERE card_sub = $1;
`;

export const INSERT_CARD_EXAMPLES = (sentencesCount: number): string => {
  const placeholders = Array.from({ length: sentencesCount }, (_, i) => `($1, $${i + 2})`).join(
    ', '
  );

  return `
    INSERT INTO cards.card_examples (card_sub, sentence) 
    VALUES ${placeholders}
    RETURNING *;
  `;
};
