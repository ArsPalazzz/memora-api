/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * League push notification preferences and rank snapshot for overtakes.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumn(
    { schema: 'users', name: 'profile' },
    {
      league_notifications: {
        type: 'boolean',
        notNull: true,
        default: true,
      },
      league_last_rank: {
        type: 'integer',
        notNull: false,
      },
      league_last_week_start: {
        type: 'date',
        notNull: false,
      },
      league_last_notified_date: {
        type: 'date',
        notNull: false,
      },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumn({ schema: 'users', name: 'profile' }, 'league_last_notified_date');
  pgm.dropColumn({ schema: 'users', name: 'profile' }, 'league_last_week_start');
  pgm.dropColumn({ schema: 'users', name: 'profile' }, 'league_last_rank');
  pgm.dropColumn({ schema: 'users', name: 'profile' }, 'league_notifications');
};
