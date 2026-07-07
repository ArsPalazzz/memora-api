/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Desk visibility model (private/public now; friends/unlisted reserved).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumn(
    { schema: 'cards', name: 'desk' },
    {
      visibility: {
        type: 'text',
        notNull: true,
        default: 'private',
      },
      share_token: {
        type: 'uuid',
        notNull: false,
      },
    }
  );

  pgm.sql(`
    UPDATE cards.desk
    SET visibility = CASE WHEN public = true THEN 'public' ELSE 'private' END
  `);

  pgm.addConstraint({ schema: 'cards', name: 'desk' }, 'desk_visibility_check', {
    check: "visibility IN ('private', 'public', 'friends', 'unlisted')",
  });

  pgm.createIndex({ schema: 'cards', name: 'desk' }, 'visibility', {
    name: 'idx_desk_visibility_feed',
    where: "visibility = 'public' AND status = 'active'",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex({ schema: 'cards', name: 'desk' }, 'idx_desk_visibility_feed');
  pgm.dropConstraint({ schema: 'cards', name: 'desk' }, 'desk_visibility_check');
  pgm.dropColumn({ schema: 'cards', name: 'desk' }, 'share_token');
  pgm.dropColumn({ schema: 'cards', name: 'desk' }, 'visibility');
};
