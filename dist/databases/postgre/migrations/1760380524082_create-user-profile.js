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
  pgm.createSchema('users', { ifNotExists: true });

  pgm.createType({ schema: 'users', name: 'profile_role' }, ['registered', 'admin']);

  pgm.createTable(
    { schema: 'users', name: 'profile' },
    {
      id: { type: 'serial', primaryKey: true },
      sub: { type: 'uuid', notNull: true, unique: true },
      nickname: { type: 'text', notNull: true },
      email: { type: 'text', notNull: true, unique: true },
      role: { type: 'users.profile_role', notNull: true },
      pass_hash: { type: 'text', notNull: true },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
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
  pgm.dropTable({ schema: 'users', name: 'profile' });
  pgm.dropType({ schema: 'users', name: 'profile_role' });
  pgm.dropSchema('users');
};
