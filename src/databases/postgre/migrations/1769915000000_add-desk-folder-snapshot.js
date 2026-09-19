/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Remember a desk's folder so it can be recreated after the folder is deleted
 * (allowed when the folder is empty or only contains archived decks).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable(
    { schema: 'cards', name: 'desk_folder_snapshot' },
    {
      desk_sub: {
        type: 'uuid',
        primaryKey: true,
      },
      folder_sub: {
        type: 'uuid',
        notNull: true,
      },
      title: {
        type: 'text',
        notNull: true,
      },
      description: {
        type: 'text',
      },
      parent_folder_sub: {
        type: 'uuid',
        notNull: false,
      },
      creator_sub: {
        type: 'uuid',
        notNull: true,
      },
    }
  );

  pgm.addConstraint(
    { schema: 'cards', name: 'desk_folder_snapshot' },
    'desk_folder_snapshot_desk_sub_fkey',
    {
      foreignKeys: {
        columns: 'desk_sub',
        references: 'cards.desk(sub)',
        onDelete: 'CASCADE',
      },
    }
  );

  pgm.sql(`
    INSERT INTO cards.desk_folder_snapshot (
      desk_sub,
      folder_sub,
      title,
      description,
      parent_folder_sub,
      creator_sub
    )
    SELECT DISTINCT ON (fd.desk_sub)
      fd.desk_sub,
      f.sub,
      f.title,
      f.description,
      f.parent_folder_sub,
      f.creator_sub
    FROM cards.folder_desk fd
    INNER JOIN cards.folder f ON f.sub = fd.folder_sub
    ORDER BY fd.desk_sub, fd.created_at DESC
    ON CONFLICT (desk_sub) DO NOTHING;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable({ schema: 'cards', name: 'desk_folder_snapshot' });
};
