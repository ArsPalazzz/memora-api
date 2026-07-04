/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable(
    { schema: 'games', name: 'match_board_slot' },
    {
      session_id: { type: 'uuid', notNull: true },
      slot_id: { type: 'integer', notNull: true },
      card_sub: { type: 'uuid', notNull: true },
      slot_text: { type: 'text', notNull: true },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    }
  );

  pgm.addConstraint(
    { schema: 'games', name: 'match_board_slot' },
    'match_board_slot_pkey',
    { primaryKey: ['session_id', 'slot_id'] }
  );

  pgm.addConstraint(
    { schema: 'games', name: 'match_board_slot' },
    'match_board_slot_session_card_unique',
    { unique: ['session_id', 'card_sub'] }
  );

  pgm.addConstraint(
    { schema: 'games', name: 'match_board_slot' },
    'match_board_slot_session_id_fkey',
    {
      foreignKeys: {
        columns: 'session_id',
        references: 'games.session(id)',
        onDelete: 'CASCADE',
      },
    }
  );

  pgm.addConstraint(
    { schema: 'games', name: 'match_board_slot' },
    'match_board_slot_card_sub_fkey',
    {
      foreignKeys: {
        columns: 'card_sub',
        references: 'cards.card(sub)',
        onDelete: 'CASCADE',
      },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable({ schema: 'games', name: 'match_board_slot' });
};
