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
  pgm.createSchema('assets', { ifNotExists: true });

  pgm.createType({ schema: 'assets', name: 'asset_type' }, ['card']);

  pgm.createTable(
    { schema: 'assets', name: 'config' },
    {
      id: { type: 'serial', primaryKey: true },
      type: { type: 'assets.asset_type', notNull: true },
      user_role: { type: 'users.profile_role', notNull: true },
      file_type: { type: 'text', notNull: true },
      size: { type: 'text', notNull: true },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    }
  );

  pgm.createTable(
    { schema: 'assets', name: 'file' },
    {
      id: { type: 'serial', primaryKey: true },
      asset_config_id: {
        type: 'integer',
        notNull: true,
        references: 'assets.config(id)',
        primaryKey: true,
      },
      owner_sub: {
        type: 'uuid',
        notNull: true,
        references: 'users.profile(sub)',
        primaryKey: true,
      },
      native_name: { type: 'text', notNull: true },
      bucket_key: { type: 'uuid', notNull: true, unique: true },
      requested_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
      confirmed_at: { type: 'timestamp' },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable({ schema: 'assets', name: 'file' });
  pgm.dropTable({ schema: 'assets', name: 'config' });
  pgm.dropType({ schema: 'assets', name: 'asset_type' });
  pgm.dropSchema('assets');
};
