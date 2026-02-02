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
    { schema: 'users', name: 'streak_stats' },
    {
      id: {
        type: 'bigserial',
        primaryKey: true,
      },
      user_id: {
        type: 'integer',
        notNull: true,
      },
      current_streak: {
        type: 'integer',
        notNull: true,
        default: 1,
      },
      longest_streak: {
        type: 'integer',
        notNull: true,
        default: 1,
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    }
  );

  pgm.addConstraint({ schema: 'users', name: 'streak_stats' }, 'streak_stats_user_id_fkey', {
    foreignKeys: {
      columns: 'user_id',
      references: 'users.profile(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.createTable(
    { schema: 'users', name: 'daily_stats' },
    {
      id: {
        type: 'bigserial',
        primaryKey: true,
      },
      user_id: {
        type: 'integer',
        notNull: true,
      },
      date: {
        type: 'date',
        notNull: true,
      },
      cards_reviewed: {
        type: 'integer',
        notNull: true,
        default: 0,
      },
      daily_goal: {
        type: 'integer',
        notNull: true,
      },
      goal_achieved: {
        type: 'boolean',
        notNull: true,
        default: false,
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    },
    {
      constraints: {
        unique: ['user_id', 'date'],
      },
    }
  );

  pgm.addConstraint({ schema: 'users', name: 'daily_stats' }, 'daily_stats_user_id_fkey', {
    foreignKeys: {
      columns: 'user_id',
      references: 'users.profile(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.createIndex({ schema: 'users', name: 'daily_stats' }, ['user_id', 'date'], {
    name: 'idx_daily_stats_user_date',
  });

  pgm.createIndex({ schema: 'users', name: 'daily_stats' }, ['date'], {
    name: 'idx_daily_stats_date',
  });

  pgm.createIndex({ schema: 'users', name: 'streak_stats' }, ['user_id'], {
    name: 'idx_streak_stats_user_id',
    unique: true,
  });

  pgm.createFunction(
    { schema: 'users', name: 'update_updated_at_column' },
    [],
    {
      language: 'plpgsql',
      returns: 'TRIGGER',
    },
    `
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger({ schema: 'users', name: 'streak_stats' }, 'update_streak_stats_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: { schema: 'users', name: 'update_updated_at_column' },
    level: 'ROW',
  });

  pgm.createTrigger({ schema: 'users', name: 'daily_stats' }, 'update_daily_stats_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: { schema: 'users', name: 'update_updated_at_column' },
    level: 'ROW',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTrigger({ schema: 'users', name: 'daily_stats' }, 'update_daily_stats_updated_at', {
    ifExists: true,
  });

  pgm.dropTrigger({ schema: 'users', name: 'streak_stats' }, 'update_streak_stats_updated_at', {
    ifExists: true,
  });

  pgm.dropFunction({ schema: 'users', name: 'update_updated_at_column' }, [], { ifExists: true });

  pgm.dropIndex({ schema: 'users', name: 'streak_stats' }, ['user_id'], {
    name: 'idx_streak_stats_user_id',
    ifExists: true,
  });

  pgm.dropIndex({ schema: 'users', name: 'daily_stats' }, ['date'], {
    name: 'idx_daily_stats_date',
    ifExists: true,
  });

  pgm.dropIndex({ schema: 'users', name: 'daily_stats' }, ['user_id', 'date'], {
    name: 'idx_daily_stats_user_date',
    ifExists: true,
  });

  pgm.dropConstraint({ schema: 'users', name: 'daily_stats' }, 'daily_stats_user_id_fkey', {
    ifExists: true,
  });

  pgm.dropConstraint({ schema: 'users', name: 'streak_stats' }, 'streak_stats_user_id_fkey', {
    ifExists: true,
  });

  pgm.dropTable({ schema: 'users', name: 'daily_stats' }, { ifExists: true, cascade: true });

  pgm.dropTable({ schema: 'users', name: 'streak_stats' }, { ifExists: true, cascade: true });
};
