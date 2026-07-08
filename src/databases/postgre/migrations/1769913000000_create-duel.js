/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createType({ schema: 'games', name: 'duel_status_enum' }, [
    'waiting',
    'countdown',
    'racing',
    'finished',
    'cancelled',
  ]);

  pgm.createTable(
    { schema: 'games', name: 'duel' },
    {
      id: { type: 'uuid', primaryKey: true },
      code: { type: 'varchar(6)', notNull: true, unique: true },
      host_sub: { type: 'uuid', notNull: true },
      desk_sub: { type: 'uuid', notNull: true },
      config: { type: 'jsonb', notNull: true },
      card_seed: { type: 'bigint', notNull: false },
      card_subs: { type: 'uuid[]', notNull: false },
      status: {
        type: { schema: 'games', name: 'duel_status_enum' },
        notNull: true,
        default: 'waiting',
      },
      started_at: { type: 'timestamp', notNull: false },
      finished_at: { type: 'timestamp', notNull: false },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    }
  );

  pgm.addConstraint({ schema: 'games', name: 'duel' }, 'duel_host_sub_fkey', {
    foreignKeys: {
      columns: 'host_sub',
      references: 'users.profile(sub)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint({ schema: 'games', name: 'duel' }, 'duel_desk_sub_fkey', {
    foreignKeys: {
      columns: 'desk_sub',
      references: 'cards.desk(sub)',
      onDelete: 'CASCADE',
    },
  });

  pgm.createIndex({ schema: 'games', name: 'duel' }, 'status');
  pgm.createIndex({ schema: 'games', name: 'duel' }, 'host_sub');

  pgm.createTable(
    { schema: 'games', name: 'duel_player' },
    {
      duel_id: { type: 'uuid', notNull: true },
      user_sub: { type: 'uuid', notNull: true },
      slot: { type: 'smallint', notNull: true },
      ready: { type: 'boolean', notNull: true, default: false },
      score: { type: 'integer', notNull: true, default: 0 },
      correct_count: { type: 'integer', notNull: true, default: 0 },
      wrong_count: { type: 'integer', notNull: true, default: 0 },
      total_time_ms: { type: 'integer', notNull: true, default: 0 },
      max_streak: { type: 'integer', notNull: true, default: 0 },
      answers: { type: 'jsonb', notNull: true, default: pgm.func("'[]'::jsonb") },
      placement: { type: 'smallint', notNull: false },
      disconnected_at: { type: 'timestamp', notNull: false },
      joined_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    }
  );

  pgm.addConstraint({ schema: 'games', name: 'duel_player' }, 'duel_player_pkey', {
    primaryKey: ['duel_id', 'user_sub'],
  });

  pgm.addConstraint({ schema: 'games', name: 'duel_player' }, 'duel_player_duel_slot_unique', {
    unique: ['duel_id', 'slot'],
  });

  pgm.addConstraint({ schema: 'games', name: 'duel_player' }, 'duel_player_duel_id_fkey', {
    foreignKeys: {
      columns: 'duel_id',
      references: 'games.duel(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint({ schema: 'games', name: 'duel_player' }, 'duel_player_user_sub_fkey', {
    foreignKeys: {
      columns: 'user_sub',
      references: 'users.profile(sub)',
      onDelete: 'CASCADE',
    },
  });

  pgm.createIndex({ schema: 'games', name: 'duel_player' }, 'user_sub');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable({ schema: 'games', name: 'duel_player' });
  pgm.dropTable({ schema: 'games', name: 'duel' });
  pgm.dropType({ schema: 'games', name: 'duel_status_enum' });
};
