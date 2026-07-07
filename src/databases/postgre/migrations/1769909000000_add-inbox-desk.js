/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Inbox model: one system desk per user (`is_inbox = true`).
 * Cards saved from Discover feed are cloned into this desk with `copy_of`
 * pointing at the source card. Inbox count = cards without study progress
 * (no SRS row or repetitions = 0). Reuses desk/card/SRS tables — no separate queue table.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumn(
    { schema: 'cards', name: 'desk' },
    {
      is_inbox: {
        type: 'boolean',
        notNull: true,
        default: false,
      },
    }
  );

  pgm.createIndex(
    { schema: 'cards', name: 'desk' },
    'creator_sub',
    {
      name: 'idx_desk_one_inbox_per_user',
      unique: true,
      where: 'is_inbox = true',
    }
  );

  pgm.sql(`
    INSERT INTO cards.desk (sub, title, description, public, creator_sub, is_inbox)
    SELECT gen_random_uuid(), 'Inbox', 'Saved from Discover feed', false, p.sub, true
    FROM users.profile p
    WHERE NOT EXISTS (
      SELECT 1 FROM cards.desk d WHERE d.creator_sub = p.sub AND d.is_inbox = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM cards.desk d WHERE d.creator_sub = p.sub AND d.title = 'Inbox'
    );

    UPDATE cards.desk
    SET is_inbox = true,
        description = COALESCE(NULLIF(description, ''), 'Saved from Discover feed')
    WHERE title = 'Inbox'
      AND is_inbox = false
      AND creator_sub IN (SELECT sub FROM users.profile);

    INSERT INTO cards.desk_settings (desk_sub, front_language, back_language, example_language)
    SELECT d.sub, 'en', 'ru', 'en'
    FROM cards.desk d
    WHERE d.is_inbox = true
      AND NOT EXISTS (
        SELECT 1 FROM cards.desk_settings ds WHERE ds.desk_sub = d.sub
      );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM cards.desk
    WHERE is_inbox = true;
  `);

  pgm.dropIndex(
    { schema: 'cards', name: 'desk' },
    [],
    { name: 'idx_desk_one_inbox_per_user' }
  );

  pgm.dropColumn({ schema: 'cards', name: 'desk' }, 'is_inbox');
};
