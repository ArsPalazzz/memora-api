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
  pgm.createSchema('notifications', { ifNotExists: true });

  pgm.createTable(
    { schema: 'notifications', name: 'fcm_token' },
    {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      user_sub: {
        type: 'uuid',
        notNull: true,
        references: 'users.profile(sub)',
        onDelete: 'CASCADE',
      },
      token: { type: 'text', notNull: true },
      device_info: { type: 'jsonb', default: '{}' },
      platform: { type: 'varchar(50)' },
      is_active: { type: 'boolean', default: true, notNull: true },
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
      last_used_at: { type: 'timestamp' },
      deactivated_at: { type: 'timestamp' },
      deactivated_reason: { type: 'varchar(100)' },
    }
  );

  pgm.addConstraint({ schema: 'notifications', name: 'fcm_token' }, 'fcm_token_token_unique', {
    unique: ['token'],
  });

  pgm.sql(`
    CREATE INDEX idx_fcm_token_user_active 
    ON notifications.fcm_token(user_sub) 
    WHERE is_active = true;
  `);

  pgm.sql(`
    CREATE INDEX idx_fcm_token_deactivated_at 
    ON notifications.fcm_token(deactivated_at);
  `);

  pgm.sql(`
    CREATE INDEX idx_fcm_token_user_sub 
    ON notifications.fcm_token(user_sub);
  `);

  pgm.sql(`
    CREATE INDEX idx_fcm_token_token 
    ON notifications.fcm_token(token);
  `);

  pgm.createFunction(
    'notifications.update_updated_at',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
    },
    `
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger({ schema: 'notifications', name: 'fcm_token' }, 'update_updated_at_trigger', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'notifications.update_updated_at',
    level: 'ROW',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTrigger({ schema: 'notifications', name: 'fcm_token' }, 'update_updated_at_trigger', {
    ifExists: true,
  });

  pgm.dropFunction('notifications.update_updated_at', [], { ifExists: true });

  pgm.dropIndex({ schema: 'notifications', name: 'fcm_token' }, 'idx_fcm_token_token', {
    ifExists: true,
  });

  pgm.dropIndex({ schema: 'notifications', name: 'fcm_token' }, 'idx_fcm_token_user_sub', {
    ifExists: true,
  });

  pgm.dropIndex({ schema: 'notifications', name: 'fcm_token' }, 'idx_fcm_token_deactivated_at', {
    ifExists: true,
  });

  pgm.sql('DROP INDEX IF EXISTS notifications.idx_fcm_token_user_active;');

  pgm.dropConstraint({ schema: 'notifications', name: 'fcm_token' }, 'fcm_token_token_unique', {
    ifExists: true,
  });

  pgm.dropTable({ schema: 'notifications', name: 'fcm_token' });
  pgm.dropSchema('notifications');
};
