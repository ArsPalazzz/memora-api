/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Per-user pinned folders for home quick access.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable(
    { schema: 'cards', name: 'pinned_folder' },
    {
      user_sub: {
        type: 'uuid',
        notNull: true,
      },
      folder_sub: {
        type: 'uuid',
        notNull: true,
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    }
  );

  pgm.addConstraint(
    { schema: 'cards', name: 'pinned_folder' },
    'pinned_folder_pkey',
    {
      primaryKey: ['user_sub', 'folder_sub'],
    }
  );

  pgm.addConstraint(
    { schema: 'cards', name: 'pinned_folder' },
    'pinned_folder_user_sub_fkey',
    {
      foreignKeys: {
        columns: 'user_sub',
        references: 'users.profile(sub)',
        onDelete: 'CASCADE',
      },
    }
  );

  pgm.addConstraint(
    { schema: 'cards', name: 'pinned_folder' },
    'pinned_folder_folder_sub_fkey',
    {
      foreignKeys: {
        columns: 'folder_sub',
        references: 'cards.folder(sub)',
        onDelete: 'CASCADE',
      },
    }
  );

  pgm.createIndex(
    { schema: 'cards', name: 'pinned_folder' },
    'user_sub',
    { name: 'pinned_folder_user_sub_idx' }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex({ schema: 'cards', name: 'pinned_folder' }, 'pinned_folder_user_sub_idx');
  pgm.dropConstraint({ schema: 'cards', name: 'pinned_folder' }, 'pinned_folder_folder_sub_fkey');
  pgm.dropConstraint({ schema: 'cards', name: 'pinned_folder' }, 'pinned_folder_user_sub_fkey');
  pgm.dropConstraint({ schema: 'cards', name: 'pinned_folder' }, 'pinned_folder_pkey');
  pgm.dropTable({ schema: 'cards', name: 'pinned_folder' });
};
