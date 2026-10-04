/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumn(
    { schema: 'cards', name: 'review_settings' },
    {
      card_orientation: {
        type: { schema: 'cards', name: 'card_orientation_enum' },
        notNull: true,
        default: 'normal',
      },
    }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumn({ schema: 'cards', name: 'review_settings' }, 'card_orientation');
};
