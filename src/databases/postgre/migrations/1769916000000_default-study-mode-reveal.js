/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Switch default study mode from write/swipe to reveal (Reveal & Grade).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE cards.desk_settings ALTER COLUMN study_mode SET DEFAULT 'reveal';
    ALTER TABLE cards.review_settings ALTER COLUMN study_mode SET DEFAULT 'reveal';
    ALTER TABLE cards.feed_settings ALTER COLUMN study_mode SET DEFAULT 'reveal';

    UPDATE cards.desk_settings SET study_mode = 'reveal' WHERE study_mode = 'write';
    UPDATE cards.review_settings SET study_mode = 'reveal' WHERE study_mode = 'write';
    UPDATE cards.feed_settings SET study_mode = 'reveal' WHERE study_mode IN ('write', 'swipe');
  `);
};

/**
 * Restores column defaults only. Existing row values are left as-is.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE cards.desk_settings ALTER COLUMN study_mode SET DEFAULT 'write';
    ALTER TABLE cards.review_settings ALTER COLUMN study_mode SET DEFAULT 'write';
    ALTER TABLE cards.feed_settings ALTER COLUMN study_mode SET DEFAULT 'swipe';
  `);
};
