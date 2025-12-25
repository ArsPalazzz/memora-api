"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeskSettingsRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const DeskSettingsRepositoryQueries_1 = require("./DeskSettingsRepositoryQueries");
class DeskSettingsRepository extends Table_1.default {
    async getByDeskSub(deskSub) {
        const query = {
            name: 'getDeskSettingsByDeskSub',
            text: DeskSettingsRepositoryQueries_1.GET_DESK_SETTINGS_BY_SUB,
            values: [deskSub],
        };
        return this.getItem(query);
    }
}
exports.DeskSettingsRepository = DeskSettingsRepository;
exports.default = new DeskSettingsRepository();
