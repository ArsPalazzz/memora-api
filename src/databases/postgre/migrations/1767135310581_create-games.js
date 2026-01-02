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
  pgm.createSchema('games', { ifNotExists: true });

  pgm.createType({ schema: 'games', name: 'game_session_enum' }, ['desk', 'review']);
  pgm.createType({ schema: 'games', name: 'game_mode_enum' }, ['write']);
  pgm.createType({ schema: 'games', name: 'game_status_enum' }, ['active', 'finished', 'aborted']);

  pgm.createTable(
    { schema: 'games', name: 'session' },
    {
      id: { type: 'uuid', primaryKey: true },
      user_sub: { type: 'uuid', notNull: true, references: 'users.profile(sub)' },
      type: { type: { schema: 'games', name: 'game_session_enum' }, notNull: true },
      mode: { type: { schema: 'games', name: 'game_mode_enum' }, notNull: true },
      desk_sub: { type: 'uuid', references: 'cards.desk(sub)' },
      batch_id: { type: 'uuid', notNull: false },
      status: { type: { schema: 'games', name: 'game_status_enum' }, notNull: true },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
      finished_at: { type: 'timestamp' },
    }
  );

  pgm.createType({ schema: 'games', name: 'card_direction_enum' }, [
    'front_to_back',
    'back_to_front',
  ]);

  pgm.createTable(
    { schema: 'games', name: 'session_card' },
    {
      id: { type: 'bigserial', primaryKey: true },
      session_id: { type: 'uuid', notNull: true, references: 'games.session(id)' },
      card_sub: { type: 'uuid', notNull: true, references: 'cards.card(sub)' },
      user_answer: { type: 'text' },
      direction: { type: { schema: 'games', name: 'card_direction_enum' }, notNull: true },
      is_correct: { type: 'boolean' },
      quality: { type: 'int' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
      answered_at: { type: 'timestamp' },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable({ schema: 'games', name: 'session_card' });
  pgm.dropType({ schema: 'games', name: 'card_direction_enum' });
  pgm.dropTable({ schema: 'games', name: 'session' });
  pgm.dropType({ schema: 'games', name: 'game_status_enum' });
  pgm.dropType({ schema: 'games', name: 'game_mode_enum' });
  pgm.dropType({ schema: 'games', name: 'game_session_enum' });
  pgm.dropSchema('games');
};
