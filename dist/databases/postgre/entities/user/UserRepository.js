"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const UserRepositoryQueries_1 = require("./UserRepositoryQueries");
class UserRepository extends Table_1.default {
    async createUser(params) {
        const { sub, nickname, email, role, passwordHash } = params;
        const query = {
            name: 'createUser',
            text: UserRepositoryQueries_1.INSERT_USER,
            values: [sub, nickname, email, role, passwordHash],
        };
        return this.insertItem(query, 'id');
    }
    async existByEmail(email) {
        const query = {
            name: 'existByEmail',
            text: `SELECT EXISTS (SELECT 1 FROM users.profile WHERE email = $1 LIMIT 1);`,
            values: [email],
        };
        return this.exists(query);
    }
    async existBySub(sub) {
        const query = {
            name: 'existProfileBySub',
            text: `SELECT EXISTS (SELECT 1 FROM users.profile WHERE sub = $1 LIMIT 1);`,
            values: [sub],
        };
        return this.exists(query);
    }
    async getProfileBySub(sub) {
        const query = {
            name: 'getProfileBySub',
            text: `SELECT sub, nickname, email, created_at FROM users.profile WHERE sub = $1 LIMIT 1;`,
            values: [sub],
        };
        return this.getItem(query);
    }
    async getProfileIdBySub(sub) {
        const query = {
            name: 'getProfileIdBySub',
            text: `SELECT id FROM users.profile WHERE sub = $1 LIMIT 1;`,
            values: [sub],
        };
        return this.getItem(query);
    }
    async getInfoByEmail(email) {
        const query = {
            name: 'getProfileByEmail',
            text: `SELECT id, sub, role, pass_hash FROM users.profile WHERE email = $1 LIMIT 1;`,
            values: [email],
        };
        return this.getItem(query);
    }
    async getAllUserIds() {
        const query = {
            name: 'getProfileByEmail',
            text: `SELECT id FROM users.profile;`,
            values: [],
        };
        const res = await this.getItems(query);
        return res.map((item) => item.id);
    }
}
exports.UserRepository = UserRepository;
exports.default = new UserRepository();
