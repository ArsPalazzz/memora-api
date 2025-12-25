"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../index"));
const exceptions_1 = require("../../../exceptions");
class Table {
    constructor(schemaName = 'public') {
        this.schemaName = schemaName;
    }
    async exec(req, client) {
        if (client)
            return client.query(req);
        return index_1.default.query(req);
    }
    async getItems(req, client) {
        const { rows } = await this.exec(req, client);
        return rows.length ? rows : [];
    }
    async getItem(req, client) {
        const { rows } = await this.exec(req, client);
        return rows.length ? rows[0] : null;
    }
    async exists(req, client) {
        const { rows } = await this.exec(req, client);
        return rows?.[0]?.exists ?? false;
    }
    async updateItems(req, client) {
        const { rowCount } = await this.exec(req, client);
        if (!rowCount) {
            throw new exceptions_1.DatabaseError('Cannot update items');
        }
        return rowCount;
    }
    async insertItem(req, returnField = 'id', client) {
        const { rows } = await this.exec(req, client);
        if (!rows?.length)
            return null;
        return rows[0][returnField];
    }
    async runQuery(req, client) {
        await this.exec(req, client);
    }
    async runQueryWithResult(req, client) {
        return await this.exec(req, client);
    }
    async startTransaction() {
        return await index_1.default.transaction();
    }
}
exports.default = Table;
