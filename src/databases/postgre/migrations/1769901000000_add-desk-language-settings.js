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
  pgm.addColumns(
    { schema: 'cards', name: 'desk_settings' },
    {
      front_language: { type: 'varchar(5)', notNull: true, default: 'en' },
      back_language: { type: 'varchar(5)', notNull: true, default: 'ru' },
      example_language: { type: 'varchar(5)', notNull: true, default: 'en' },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumns({ schema: 'cards', name: 'desk_settings' }, [
    'front_language',
    'back_language',
    'example_language',
  ]);
};
