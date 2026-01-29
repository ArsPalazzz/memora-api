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
    { schema: 'cards', name: 'user_card_preferences' },
    {
      id: { type: 'serial', primaryKey: true },
      user_sub: {
        type: 'uuid',
        notNull: true,
        references: 'users.profile(sub)',
        onDelete: 'CASCADE',
      },
      card_sub: {
        type: 'uuid',
        notNull: true,
        references: 'cards.card(sub)',
        onDelete: 'CASCADE',
      },
      action: {
        type: 'varchar(20)',
        notNull: true,
        check: "action IN ('shown', 'liked', 'answered')",
      },
      shown_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    },
    {
      constraints: {
        unique: ['user_sub', 'card_sub'],
      },
    }
  );

  pgm.addColumn(
    { schema: 'cards', name: 'card' },
    {
      global_shown_count: {
        type: 'integer',
        notNull: true,
        default: 0,
      },
      global_like_count: {
        type: 'integer',
        notNull: true,
        default: 0,
      },
      global_answer_count: {
        type: 'integer',
        notNull: true,
        default: 0,
      },
      desk_sub_text_search: {
        type: 'tsvector',
        notNull: false,
      },
    }
  );

  pgm.createIndex({ schema: 'cards', name: 'user_card_preferences' }, ['user_sub', 'shown_at'], {
    name: 'idx_user_preferences_chronological',
    order: { shown_at: 'DESC' },
  });

  pgm.createIndex({ schema: 'cards', name: 'card' }, ['global_shown_count'], {
    name: 'idx_card_global_popularity',
    where: 'global_shown_count > 0',
  });

  pgm.sql(`
    CREATE OR REPLACE FUNCTION cards.update_card_search_vector()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.desk_sub_text_search = 
        setweight(to_tsvector('english', COALESCE((SELECT title FROM cards.desk WHERE sub = NEW.desk_sub), '')), 'A');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER card_search_vector_update
    BEFORE INSERT OR UPDATE ON cards.card
    FOR EACH ROW EXECUTE FUNCTION cards.update_card_search_vector();
  `);
};

export const down = (pgm) => {
  pgm.dropTrigger({ schema: 'cards', name: 'card' }, 'card_search_vector_update');
  pgm.dropFunction({ schema: 'cards', name: 'update_card_search_vector' }, []);

  pgm.dropIndex({ schema: 'cards', name: 'card' }, 'idx_card_global_popularity');
  pgm.dropIndex(
    { schema: 'cards', name: 'user_card_preferences' },
    'idx_user_preferences_chronological'
  );

  pgm.dropColumn({ schema: 'cards', name: 'card' }, 'desk_sub_text_search');
  pgm.dropColumn({ schema: 'cards', name: 'card' }, 'global_answer_count');
  pgm.dropColumn({ schema: 'cards', name: 'card' }, 'global_like_count');
  pgm.dropColumn({ schema: 'cards', name: 'card' }, 'global_shown_count');

  pgm.dropTable({ schema: 'cards', name: 'user_card_preferences' });
};
