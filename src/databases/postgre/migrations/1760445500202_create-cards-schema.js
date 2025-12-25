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
    { schema: 'cards', name: 'public_desk' },
    {
      id: { type: 'serial', primaryKey: true },
      desk_sub: { type: 'uuid', notNull: true, references: 'cards.desk(sub)' },
      user_sub: {
        type: 'uuid',
        notNull: true,
        references: 'users.profile(sub)',
      },
      added_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
      last_time_played: { type: 'timestamp' },
    },
    {
      constraints: {
        unique: ['desk_sub', 'user_sub'],
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
        references: 'cards.desk(sub)',
      },
      front_side: { type: 'text', notNull: true },
      back_side: { type: 'text', notNull: true },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    }
  );

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
        references: 'cards.desk(sub)',
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
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable({ schema: 'cards', name: 'desk_settings' });
  pgm.dropType({ schema: 'cards', name: 'card_orientation_enum' });
  pgm.dropTable({ schema: 'cards', name: 'card' });
  pgm.dropTable({ schema: 'cards', name: 'public_desk' });
  pgm.dropTable({ schema: 'cards', name: 'desk' });
  pgm.dropSchema('cards');
};
