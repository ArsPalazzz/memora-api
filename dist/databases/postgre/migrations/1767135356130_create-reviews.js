/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createSchema('reviews', { ifNotExists: true });

  pgm.createTable(
    { schema: 'reviews', name: 'card_review' },
    {
      id: { type: 'bigserial', primaryKey: true },
      user_sub: { type: 'uuid', notNull: true, references: 'users.profile(sub)' },
      card_sub: { type: 'uuid', notNull: true, references: 'cards.card(sub)' },
      repetitions: { type: 'int', notNull: true, default: 0 },
      interval_days: { type: 'int', notNull: true, default: 0 },
      ease_factor: { type: 'float', notNull: true, default: 2.5 },
      next_review_at: { type: 'timestamp', notNull: true },
      last_reviewed_at: { type: 'timestamp' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    },
    {
      constraints: { unique: ['user_sub', 'card_sub'] },
    }
  );

  pgm.createTable(
    { schema: 'reviews', name: 'review_batch' },
    {
      id: { type: 'uuid', primaryKey: true },
      user_sub: { type: 'uuid', notNull: true, references: 'users.profile(sub)' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
      notified_at: { type: 'timestamp' },
    }
  );

  pgm.createTable(
    { schema: 'reviews', name: 'review_batch_card' },
    {
      batch_id: { type: 'uuid', notNull: true, references: 'reviews.review_batch(id)' },
      card_sub: { type: 'uuid', notNull: true, references: 'cards.card(sub)' },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable({ schema: 'reviews', name: 'review_batch_card' });
  pgm.dropTable({ schema: 'reviews', name: 'review_batch' });
  pgm.dropTable({ schema: 'reviews', name: 'card_review' });
  pgm.dropSchema('reviews');
};
