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
  pgm.createType({ schema: 'cards', name: 'import_job_status_enum' }, [
    'pending',
    'processing',
    'completed',
    'failed',
  ]);

  pgm.createTable(
    { schema: 'cards', name: 'import_job' },
    {
      id: { type: 'serial', primaryKey: true },
      sub: { type: 'uuid', notNull: true, unique: true },
      user_sub: {
        type: 'uuid',
        notNull: true,
        references: 'users.profile(sub)',
        onDelete: 'CASCADE',
      },
      status: {
        type: { schema: 'cards', name: 'import_job_status_enum' },
        notNull: true,
        default: 'pending',
      },
      progress: { type: 'integer', notNull: true, default: 0 },
      total: { type: 'integer', notNull: true, default: 0 },
      payload: { type: 'jsonb', notNull: true },
      result: { type: 'jsonb' },
      error_message: { type: 'text' },
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

  pgm.createIndex({ schema: 'cards', name: 'import_job' }, 'user_sub');
  pgm.createIndex({ schema: 'cards', name: 'import_job' }, ['user_sub', 'status']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable({ schema: 'cards', name: 'import_job' });
  pgm.dropType({ schema: 'cards', name: 'import_job_status_enum' });
};
