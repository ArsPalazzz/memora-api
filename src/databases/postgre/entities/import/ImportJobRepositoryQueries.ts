export const INSERT_IMPORT_JOB = `
  INSERT INTO cards.import_job (sub, user_sub, status, progress, total, payload)
  VALUES ($1, $2, 'pending', 0, $3, $4::jsonb)
  RETURNING sub, status, progress, total, created_at;
`;

export const GET_IMPORT_JOB_BY_SUB = `
  SELECT sub, user_sub, status, progress, total, payload, result, error_message, created_at, updated_at
  FROM cards.import_job
  WHERE sub = $1 AND user_sub = $2;
`;

export const UPDATE_IMPORT_JOB_STATUS = `
  UPDATE cards.import_job
  SET status = $3, progress = $4, total = $5, result = $6::jsonb, error_message = $7, updated_at = CURRENT_TIMESTAMP
  WHERE sub = $1 AND user_sub = $2;
`;

export const UPDATE_IMPORT_JOB_PROGRESS = `
  UPDATE cards.import_job
  SET progress = $3, updated_at = CURRENT_TIMESTAMP
  WHERE sub = $1 AND user_sub = $2;
`;
