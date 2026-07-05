/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Prevent streak updates from running twice for the same day (e.g. on server restarts).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumn(
    { schema: 'users', name: 'streak_stats' },
    {
      last_streak_processed_date: {
        type: 'date',
        notNull: false,
      },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumn({ schema: 'users', name: 'streak_stats' }, 'last_streak_processed_date');
};
