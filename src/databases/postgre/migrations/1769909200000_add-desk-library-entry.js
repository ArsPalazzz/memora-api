/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Tracks public desks copied into a user's library.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable(
    { schema: 'cards', name: 'desk_library_entry' },
    {
      sub: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      user_sub: {
        type: 'uuid',
        notNull: true,
        references: 'users.profile(sub)',
        onDelete: 'CASCADE',
      },
      source_desk_sub: {
        type: 'uuid',
        notNull: true,
        references: 'cards.desk(sub)',
        onDelete: 'CASCADE',
      },
      local_desk_sub: {
        type: 'uuid',
        notNull: true,
        references: 'cards.desk(sub)',
        onDelete: 'CASCADE',
      },
      source_creator_sub: {
        type: 'uuid',
        notNull: true,
        references: 'users.profile(sub)',
        onDelete: 'CASCADE',
      },
      mode: {
        type: 'text',
        notNull: true,
        default: 'snapshot',
      },
      created_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    },
    {
      constraints: {
        unique: ['user_sub', 'source_desk_sub'],
      },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable({ schema: 'cards', name: 'desk_library_entry' });
};
