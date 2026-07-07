/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Opt-in public activity stats on user profiles (privacy by default).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumn(
    { schema: 'users', name: 'profile' },
    {
      stats_public: {
        type: 'boolean',
        notNull: true,
        default: false,
      },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumn({ schema: 'users', name: 'profile' }, 'stats_public');
};
