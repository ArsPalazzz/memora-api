/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Make activity stats public by default for existing deployments.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users.profile
      ALTER COLUMN stats_public SET DEFAULT true;

    UPDATE users.profile
      SET stats_public = true
      WHERE stats_public = false;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users.profile
      ALTER COLUMN stats_public SET DEFAULT false;
  `);
};
