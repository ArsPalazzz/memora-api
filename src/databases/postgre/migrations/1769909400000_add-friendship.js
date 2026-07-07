/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Friend requests and accepted friendships between users.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable(
    { schema: 'users', name: 'friendship' },
    {
      requester_sub: {
        type: 'uuid',
        notNull: true,
        references: 'users.profile(sub)',
        onDelete: 'CASCADE',
      },
      addressee_sub: {
        type: 'uuid',
        notNull: true,
        references: 'users.profile(sub)',
        onDelete: 'CASCADE',
      },
      status: {
        type: 'text',
        notNull: true,
      },
      created_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    },
    {
      constraints: {
        primaryKey: ['requester_sub', 'addressee_sub'],
      },
    }
  );

  pgm.addConstraint({ schema: 'users', name: 'friendship' }, 'friendship_status_check', {
    check: "status IN ('pending', 'accepted')",
  });

  pgm.addConstraint({ schema: 'users', name: 'friendship' }, 'friendship_not_self', {
    check: 'requester_sub != addressee_sub',
  });

  pgm.createIndex({ schema: 'users', name: 'friendship' }, 'addressee_sub', {
    name: 'idx_friendship_addressee_sub',
  });

  pgm.createIndex({ schema: 'users', name: 'friendship' }, 'requester_sub', {
    name: 'idx_friendship_requester_sub',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex({ schema: 'users', name: 'friendship' }, 'idx_friendship_requester_sub');
  pgm.dropIndex({ schema: 'users', name: 'friendship' }, 'idx_friendship_addressee_sub');
  pgm.dropConstraint({ schema: 'users', name: 'friendship' }, 'friendship_not_self');
  pgm.dropConstraint({ schema: 'users', name: 'friendship' }, 'friendship_status_check');
  pgm.dropTable({ schema: 'users', name: 'friendship' });
};
