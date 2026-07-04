/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`ALTER TYPE games.game_mode_enum ADD VALUE IF NOT EXISTS 'reveal'`);
  pgm.sql(`ALTER TYPE games.game_mode_enum ADD VALUE IF NOT EXISTS 'match'`);

  pgm.addColumn(
    { schema: 'cards', name: 'desk_settings' },
    {
      study_mode: {
        type: 'games.game_mode_enum',
        notNull: true,
        default: 'write',
      },
    }
  );

  pgm.addColumn(
    { schema: 'cards', name: 'review_settings' },
    {
      study_mode: {
        type: 'games.game_mode_enum',
        notNull: true,
        default: 'write',
      },
    }
  );

  pgm.addColumn(
    { schema: 'cards', name: 'feed_settings' },
    {
      study_mode: {
        type: 'games.game_mode_enum',
        notNull: true,
        default: 'swipe',
      },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumn({ schema: 'cards', name: 'desk_settings' }, 'study_mode');
  pgm.dropColumn({ schema: 'cards', name: 'review_settings' }, 'study_mode');
  pgm.dropColumn({ schema: 'cards', name: 'feed_settings' }, 'study_mode');
};
