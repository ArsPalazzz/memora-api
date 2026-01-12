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
  pgm.createSchema('cards', { ifNotExists: true });

  pgm.createType({ schema: 'cards', name: 'desk_status_enum' }, ['active', 'archived']);

  pgm.createTable(
    { schema: 'cards', name: 'desk' },
    {
      id: { type: 'serial', primaryKey: true },
      sub: { type: 'uuid', notNull: true, unique: true },
      title: { type: 'text', notNull: true },
      description: { type: 'text' },
      creator_sub: {
        type: 'uuid',
        notNull: true,
        references: 'users.profile(sub)',
      },
      status: {
        type: { schema: 'cards', name: 'desk_status_enum' },
        notNull: true,
        default: 'active',
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
      last_time_played: { type: 'timestamp' },
    },
    {
      constraints: {
        unique: ['creator_sub', 'title'],
      },
    }
  );

  pgm.createTable(
    { schema: 'cards', name: 'card' },
    {
      id: { type: 'serial', primaryKey: true },
      sub: { type: 'uuid', notNull: true, unique: true },
      image_uuid: {
        type: 'uuid',
        references: 'assets.file(bucket_key)',
        notNull: false,
      },
      desk_sub: {
        type: 'uuid',
        notNull: true,
      },
      front_variants: {
        type: 'jsonb',
        notNull: true,
        default: pgm.func(`'[]'::jsonb`),
      },
      back_variants: {
        type: 'jsonb',
        notNull: true,
        default: pgm.func(`'[]'::jsonb`),
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    }
  );

  pgm.addConstraint({ schema: 'cards', name: 'card' }, 'card_desk_sub_fkey', {
    foreignKeys: {
      columns: 'desk_sub',
      references: 'cards.desk(sub)',
      onDelete: 'CASCADE',
    },
  });

  pgm.createType({ schema: 'cards', name: 'card_orientation_enum' }, [
    'normal',
    'reversed',
    'mixed',
  ]);

  pgm.createTable(
    { schema: 'cards', name: 'desk_settings' },
    {
      id: { type: 'serial', primaryKey: true },
      desk_sub: {
        type: 'uuid',
        notNull: true,
      },
      cards_per_session: {
        type: 'integer',
        notNull: true,
        default: 10,
      },
      card_orientation: {
        type: { schema: 'cards', name: 'card_orientation_enum' },
        notNull: true,
        default: 'normal',
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    }
  );

  pgm.addConstraint({ schema: 'cards', name: 'desk_settings' }, 'desk_settings_desk_sub_fkey', {
    foreignKeys: {
      columns: 'desk_sub',
      references: 'cards.desk(sub)',
      onDelete: 'CASCADE',
    },
  });

  pgm.createTable(
    { schema: 'cards', name: 'user_card_srs' },
    {
      user_sub: {
        type: 'uuid',
        notNull: true,
      },
      card_sub: {
        type: 'uuid',
        notNull: true,
      },

      repetitions: { type: 'int', notNull: true, default: 0 },
      interval_days: { type: 'int', notNull: true, default: 0 },
      ease_factor: { type: 'numeric(4,2)', notNull: true, default: 2.5 },

      next_review: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('NOW()'),
      },
      last_review: { type: 'timestamp' },
    },
    {
      constraints: {
        primaryKey: ['user_sub', 'card_sub'],
      },
    }
  );

  pgm.addConstraint({ schema: 'cards', name: 'user_card_srs' }, 'user_card_srs_profile_sub_fkey', {
    foreignKeys: {
      columns: 'user_sub',
      references: 'users.profile(sub)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint({ schema: 'cards', name: 'user_card_srs' }, 'user_card_srs_card_sub_fkey', {
    foreignKeys: {
      columns: 'card_sub',
      references: 'cards.card(sub)',
      onDelete: 'CASCADE',
    },
  });

  pgm.createTable(
    { schema: 'cards', name: 'card_examples' },
    {
      id: { type: 'serial', primaryKey: true },
      card_sub: {
        type: 'uuid',
        notNull: true,
      },
      sentence: { type: 'text', notNull: true },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    },
    {
      constraints: {
        unique: ['card_sub', 'sentence'],
      },
    }
  );

  pgm.addConstraint({ schema: 'cards', name: 'card_examples' }, 'card_examples_card_sub_fkey', {
    foreignKeys: {
      columns: 'card_sub',
      references: 'cards.card(sub)',
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
  pgm.dropConstraint({ schema: 'cards', name: 'card_examples' }, 'card_examples_card_sub_fkey');
  pgm.dropConstraint({ schema: 'cards', name: 'user_card_srs' }, 'user_card_srs_card_sub_fkey');
  pgm.dropConstraint({ schema: 'cards', name: 'user_card_srs' }, 'user_card_srs_profile_sub_fkey');
  pgm.dropConstraint({ schema: 'cards', name: 'desk_settings' }, 'desk_settings_desk_sub_fkey');
  pgm.dropConstraint({ schema: 'cards', name: 'card' }, 'card_desk_sub_fkey');

  pgm.dropTable({ schema: 'cards', name: 'card_examples' });
  pgm.dropTable({ schema: 'cards', name: 'user_card_srs' });
  pgm.dropTable({ schema: 'cards', name: 'desk_settings' });
  pgm.dropType({ schema: 'cards', name: 'card_orientation_enum' });
  pgm.dropTable({ schema: 'cards', name: 'card' });
  pgm.dropTable({ schema: 'cards', name: 'desk' });
  pgm.dropType({ schema: 'cards', name: 'desk_status_enum' });
  pgm.dropSchema('cards');
};
