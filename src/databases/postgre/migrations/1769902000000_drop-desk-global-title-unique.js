/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Desk titles are unique per folder (or at root), not globally per user.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.dropConstraint({ schema: 'cards', name: 'desk' }, 'desk_creator_sub_title_key', {
    ifExists: true,
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.addConstraint({ schema: 'cards', name: 'desk' }, 'desk_creator_sub_title_key', {
    unique: ['creator_sub', 'title'],
  });
};
