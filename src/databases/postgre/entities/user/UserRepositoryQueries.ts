export const INSERT_USER = `
  INSERT INTO users.profile (sub, nickname, email, role, pass_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *;
`;
