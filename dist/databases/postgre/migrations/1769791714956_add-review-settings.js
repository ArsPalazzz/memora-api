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
  pgm.createTable(
    { schema: 'cards', name: 'review_settings' },
    {
      id: { type: 'serial', primaryKey: true },
      user_sub: {
        type: 'uuid',
        notNull: true,
      },
      cards_per_session: {
        type: 'integer',
        notNull: true,
        default: 10,
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    }
  );

  pgm.addConstraint({ schema: 'cards', name: 'review_settings' }, 'review_settings_user_sub_fkey', {
    foreignKeys: {
      columns: 'user_sub',
      references: 'users.profile(sub)',
      onDelete: 'CASCADE',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropConstraint({ schema: 'cards', name: 'review_settings' }, 'review_settings_user_sub_fkey');
  pgm.dropTable({ schema: 'cards', name: 'review_settings' });
};
