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
    { schema: 'reviews', name: 'review_batch' },
    {
      id: { type: 'uuid', primaryKey: true },
      user_sub: { type: 'uuid', notNull: true },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
      notified_at: { type: 'timestamp' },
    }
  );

  pgm.addConstraint({ schema: 'reviews', name: 'review_batch' }, 'review_batch_user_sub_fkey', {
    foreignKeys: {
      columns: 'user_sub',
      references: 'users.profile(sub)',
      onDelete: 'CASCADE',
    },
  });

  pgm.createTable(
    { schema: 'reviews', name: 'review_batch_card' },
    {
      id: { type: 'bigserial', primaryKey: true },
      batch_id: { type: 'uuid', notNull: true },
      card_sub: { type: 'uuid', notNull: true },
      reviewed_at: { type: 'timestamp' },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    },
    {
      constraints: {
        unique: ['batch_id', 'card_sub'],
      },
    }
  );

  pgm.addConstraint(
    { schema: 'reviews', name: 'review_batch_card' },
    'review_batch_card_sub_fkey',
    {
      foreignKeys: {
        columns: 'batch_id',
        references: 'reviews.review_batch(id)',
        onDelete: 'CASCADE',
      },
    }
  );

  pgm.addConstraint(
    { schema: 'reviews', name: 'review_batch_card' },
    'review_batch_card_card_sub_fkey',
    {
      foreignKeys: {
        columns: 'card_sub',
        references: 'cards.card(sub)',
        onDelete: 'CASCADE',
      },
    }
  );

  pgm.createIndex({ schema: 'reviews', name: 'review_batch' }, ['user_sub', 'created_at'], {
    name: 'idx_review_batch_user_created',
  });

  pgm.createIndex({ schema: 'reviews', name: 'review_batch_card' }, ['batch_id'], {
    name: 'idx_review_batch_card_batch',
  });

  pgm.createIndex({ schema: 'reviews', name: 'review_batch_card' }, ['batch_id', 'reviewed_at'], {
    name: 'idx_review_batch_card_reviewed',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex({ schema: 'reviews', name: 'review_batch_card' }, ['batch_id', 'reviewed_at'], {
    name: 'idx_review_batch_card_reviewed',
    ifExists: true,
  });

  pgm.dropIndex({ schema: 'reviews', name: 'review_batch_card' }, ['batch_id'], {
    name: 'idx_review_batch_card_batch',
    ifExists: true,
  });

  pgm.dropIndex({ schema: 'reviews', name: 'review_batch' }, ['user_sub', 'created_at'], {
    name: 'idx_review_batch_user_created',
    ifExists: true,
  });

  pgm.dropConstraint(
    { schema: 'reviews', name: 'review_batch_card' },
    'review_batch_card_card_sub_fkey',
    { ifExists: true }
  );

  pgm.dropConstraint(
    { schema: 'reviews', name: 'review_batch_card' },
    'review_batch_card_sub_fkey',
    { ifExists: true }
  );

  pgm.dropConstraint({ schema: 'reviews', name: 'review_batch' }, 'review_batch_user_sub_fkey', {
    ifExists: true,
  });

  pgm.dropTable(
    { schema: 'reviews', name: 'review_batch_card' },
    { ifExists: true, cascade: true }
  );
  pgm.dropTable({ schema: 'reviews', name: 'review_batch' }, { ifExists: true, cascade: true });

  pgm.dropSchema('reviews', { ifExists: true, cascade: true });
};
