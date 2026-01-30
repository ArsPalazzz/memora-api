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
    { schema: 'cards', name: 'folder' },
    {
      id: { type: 'serial', primaryKey: true },
      sub: { type: 'uuid', notNull: true, unique: true },
      title: { type: 'text', notNull: true },
      description: { type: 'text' },
      creator_sub: {
        type: 'uuid',
        notNull: true,
      },
      parent_folder_sub: {
        type: 'uuid',
        notNull: false,
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    }
  );

  pgm.addConstraint({ schema: 'cards', name: 'folder' }, 'folder_creator_sub_fkey', {
    foreignKeys: {
      columns: 'creator_sub',
      references: 'users.profile(sub)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint({ schema: 'cards', name: 'folder' }, 'folder_parent_folder_sub_fkey', {
    foreignKeys: {
      columns: 'parent_folder_sub',
      references: 'cards.folder(sub)',
      onDelete: 'SET NULL',
    },
  });

  pgm.addConstraint({ schema: 'cards', name: 'folder' }, 'folder_parent_folder_sub_not_self', {
    check: 'parent_folder_sub != sub OR parent_folder_sub IS NULL',
  });

  pgm.createTable(
    { schema: 'cards', name: 'folder_desk' },
    {
      folder_sub: {
        type: 'uuid',
        notNull: true,
      },
      desk_sub: {
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

  pgm.addConstraint({ schema: 'cards', name: 'folder_desk' }, 'folder_desk_folder_sub_fkey', {
    foreignKeys: {
      columns: 'folder_sub',
      references: 'cards.folder(sub)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint({ schema: 'cards', name: 'folder_desk' }, 'folder_desk_desk_sub_fkey', {
    foreignKeys: {
      columns: 'desk_sub',
      references: 'cards.desk(sub)',
      onDelete: 'CASCADE',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropConstraint({ schema: 'cards', name: 'folder_desk' }, 'folder_desk_desk_sub_fkey');
  pgm.dropConstraint({ schema: 'cards', name: 'folder_desk' }, 'folder_desk_folder_sub_fkey');
  pgm.dropConstraint({ schema: 'cards', name: 'folder' }, 'folder_parent_folder_sub_not_self');
  pgm.dropConstraint({ schema: 'cards', name: 'folder' }, 'folder_parent_folder_sub_fkey');
  pgm.dropConstraint({ schema: 'cards', name: 'folder' }, 'folder_creator_sub_fkey');

  pgm.dropTable({ schema: 'cards', name: 'folder_desk' });
  pgm.dropTable({ schema: 'cards', name: 'folder' });
};
