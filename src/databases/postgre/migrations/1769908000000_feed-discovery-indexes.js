/**
 * Indexes for feed card discovery (getCardForFeed).
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createIndex({ schema: 'cards', name: 'desk' }, ['creator_sub'], {
    name: 'idx_desk_public_feed',
    where: 'public = true AND status = \'active\'',
  });

  pgm.createIndex({ schema: 'cards', name: 'card' }, ['desk_sub'], {
    name: 'idx_card_feed_original',
    where: 'copy_of IS NULL AND global_shown_count < 1000',
  });

  pgm.createIndex({ schema: 'cards', name: 'card' }, ['copy_of'], {
    name: 'idx_card_copy_of',
    where: 'copy_of IS NOT NULL',
  });

  pgm.createIndex({ schema: 'games', name: 'session_card' }, ['session_id'], {
    name: 'idx_session_card_session_id',
  });

  pgm.createIndex({ schema: 'games', name: 'session_card' }, ['session_id', 'card_sub'], {
    name: 'idx_session_card_session_card',
  });

  pgm.sql(`
    CREATE INDEX idx_card_desk_sub_text_search
    ON cards.card
    USING GIN (desk_sub_text_search)
    WHERE desk_sub_text_search IS NOT NULL;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS cards.idx_card_desk_sub_text_search;');
  pgm.dropIndex({ schema: 'games', name: 'session_card' }, 'idx_session_card_session_card');
  pgm.dropIndex({ schema: 'games', name: 'session_card' }, 'idx_session_card_session_id');
  pgm.dropIndex({ schema: 'cards', name: 'card' }, 'idx_card_copy_of');
  pgm.dropIndex({ schema: 'cards', name: 'card' }, 'idx_card_feed_original');
  pgm.dropIndex({ schema: 'cards', name: 'desk' }, 'idx_desk_public_feed');
};
