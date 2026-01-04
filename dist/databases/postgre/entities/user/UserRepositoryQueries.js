"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSERT_USER = void 0;
exports.INSERT_USER = `
  INSERT INTO users.profile (sub, nickname, email, role, pass_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *;
`;
