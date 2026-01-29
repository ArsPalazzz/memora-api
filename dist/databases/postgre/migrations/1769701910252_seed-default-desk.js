/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = async (pgm) => {
  const defaultDeskConfig = {
    sub: 'acde070d-8c4c-4f0d-9d8a-162843c10333',
    title: 'Default Desk',
    description: 'Default system desk for all users',
    creatorSub: 'cb7d0674-03f9-48c4-aec7-45a9c8880c2a',
    public: true,
    status: 'active',
  };

  await pgm.db.query(
    `
    INSERT INTO cards.desk (
      sub, 
      title, 
      description, 
      creator_sub, 
      public, 
      status,
      created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, 
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (sub) DO NOTHING
    RETURNING sub;
  `,
    [
      defaultDeskConfig.sub,
      defaultDeskConfig.title,
      defaultDeskConfig.description,
      defaultDeskConfig.creatorSub,
      defaultDeskConfig.public,
      defaultDeskConfig.status,
    ]
  );

  await pgm.db.query(
    `
    INSERT INTO cards.desk_settings (
      desk_sub, 
      cards_per_session, 
      card_orientation,
      created_at
    ) VALUES (
      $1, $2, $3, 
      CURRENT_TIMESTAMP
    );
  `,
    [defaultDeskConfig.sub, 10, 'normal']
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = async (pgm) => {
  const DEFAULT_DESK_SUB = 'acde070d-8c4c-4f0d-9d8a-162843c10333';

  await pgm.db.query(
    `
    DELETE FROM cards.desk_settings 
    WHERE desk_sub = $1;
  `,
    [DEFAULT_DESK_SUB]
  );

  await pgm.db.query(
    `
    DELETE FROM cards.desk 
    WHERE sub = $1;
  `,
    [DEFAULT_DESK_SUB]
  );
};
