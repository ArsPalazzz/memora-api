"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFolderInfoCtr = exports.getFolderContentsCtr = void 0;
exports.getCardsCtr = getCardsCtr;
exports.getDesksCtr = getDesksCtr;
exports.getArchivedDesksCtr = getArchivedDesksCtr;
exports.getDeskSubsCtr = getDeskSubsCtr;
exports.getDeskInfoCtr = getDeskInfoCtr;
exports.getDeskCardsCtr = getDeskCardsCtr;
exports.createCardCtr = createCardCtr;
exports.createFolderCtr = createFolderCtr;
exports.getFoldersCtr = getFoldersCtr;
exports.createDeskCtr = createDeskCtr;
exports.updateDeskCtr = updateDeskCtr;
exports.updateFeedSettingsCtr = updateFeedSettingsCtr;
exports.getCardCtr = getCardCtr;
exports.updateCardCtr = updateCardCtr;
exports.deleteCardCtr = deleteCardCtr;
exports.archivedDeskCtr = archivedDeskCtr;
exports.restoreDeskCtr = restoreDeskCtr;
exports.updateDeskSettingsCtr = updateDeskSettingsCtr;
exports.updateReviewSettingsCtr = updateReviewSettingsCtr;
const CardService_1 = __importDefault(require("../../../services/cards/CardService"));
const UserService_1 = __importDefault(require("../../../services/users/UserService"));
const utils_1 = require("../../../utils");
const http_errors_1 = __importDefault(require("http-errors"));
const createCardDtoSchema = __importStar(require("./schemas/createCardDto.json"));
const createDeskDtoSchema = __importStar(require("./schemas/createDeskDto.json"));
const createFolderDtoSchema = __importStar(require("./schemas/createFolderDto.json"));
const getDeskInfoDtoSchema = __importStar(require("./schemas/getDeskInfoDto.json"));
const updateDeskSettingsBodyDtoSchema = __importStar(require("./schemas/updateDeskSettingsBodyDto.json"));
const updateReviewSettingsBodyDtoSchema = __importStar(require("./schemas/updateReviewSettingsBodyDto.json"));
const updateDeskSettingsParamsDtoSchema = __importStar(require("./schemas/updateDeskSettingsParamsDto.json"));
const updateDeskBodyDtoSchema = __importStar(require("./schemas/updateDeskBodyDto.json"));
const updateFeedSettingsBodyDtoSchema = __importStar(require("./schemas/updateFeedSettingsBodyDto.json"));
const updateCardBodyDtoSchema = __importStar(require("./schemas/updateCardBodyDto.json"));
const updateDeskParamsDtoSchema = __importStar(require("./schemas/updateDeskParamsDto.json"));
const validateCreateCardDto = utils_1.ajv.compile(createCardDtoSchema);
const validateCreateDeskDto = utils_1.ajv.compile(createDeskDtoSchema);
const validateCreateFolderDto = utils_1.ajv.compile(createFolderDtoSchema);
const validateGetDeskInfoDto = utils_1.ajv.compile(getDeskInfoDtoSchema);
const validateUpdateDeskSettingsBodyDto = utils_1.ajv.compile(updateDeskSettingsBodyDtoSchema);
const validateUpdateReviewSettingsBodyDto = utils_1.ajv.compile(updateReviewSettingsBodyDtoSchema);
const validateUpdateDeskSettingsParamsDto = utils_1.ajv.compile(updateDeskSettingsParamsDtoSchema);
const validateUpdateDeskBodyDto = utils_1.ajv.compile(updateDeskBodyDtoSchema);
const validateUpdateFeedSettingsBodyDto = utils_1.ajv.compile(updateFeedSettingsBodyDtoSchema);
const validateUpdateCardBodyDto = utils_1.ajv.compile(updateCardBodyDtoSchema);
const validateUpdateDeskParamsDto = utils_1.ajv.compile(updateDeskParamsDtoSchema);
async function getCardsCtr(req, res, next) {
    try {
        const cards = await CardService_1.default.getAllCards();
        res.json(cards);
    }
    catch (e) {
        next(e);
    }
}
async function getDesksCtr(req, res, next) {
    try {
        const creatorSub = res.locals.userSub;
        const desks = await CardService_1.default.getUserDesksWithStats(creatorSub);
        res.json(desks);
    }
    catch (e) {
        next(e);
    }
}
async function getArchivedDesksCtr(req, res, next) {
    try {
        const creatorSub = res.locals.userSub;
        const desks = await CardService_1.default.getArchivedDesksWithStats(creatorSub);
        res.json(desks);
    }
    catch (e) {
        next(e);
    }
}
async function getDeskSubsCtr(req, res, next) {
    try {
        const creatorSub = res.locals.userSub;
        const desks = await CardService_1.default.getUserDeskShort(creatorSub);
        res.json(desks);
    }
    catch (e) {
        next(e);
    }
}
async function getDeskInfoCtr(req, res, next) {
    try {
        const params = { sub: req.params.sub };
        if (!validateGetDeskInfoDto(params)) {
            return next((0, http_errors_1.default)(422, 'Incorrect desk params', {
                errors: validateGetDeskInfoDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        const desk = await CardService_1.default.getDesk({ sub: creatorSub, desk_sub: params.sub });
        res.json(desk);
    }
    catch (e) {
        next(e);
    }
}
async function getDeskCardsCtr(req, res, next) {
    try {
        const params = { sub: req.params.sub };
        if (!validateGetDeskInfoDto(params)) {
            return next((0, http_errors_1.default)(422, 'Incorrect desk params', {
                errors: validateGetDeskInfoDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        const cards = await CardService_1.default.getCardsDesk({ sub: creatorSub, desk_sub: params.sub });
        res.json(cards);
    }
    catch (e) {
        next(e);
    }
}
async function createCardCtr(req, res, next) {
    try {
        if (!validateCreateCardDto(req.body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect card body', {
                errors: validateCreateCardDto.errors,
            }));
        }
        const payload = req.body;
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        const cardSub = await CardService_1.default.createCard(payload);
        res.json({ sub: cardSub });
    }
    catch (e) {
        next(e);
    }
}
async function createFolderCtr(req, res, next) {
    try {
        if (!validateCreateFolderDto(req.body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect folder body', {
                errors: validateCreateFolderDto.errors,
            }));
        }
        const { title, description, parent_folder_sub } = req.body;
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        await CardService_1.default.createFolder({
            title,
            description,
            parentFolderSub: parent_folder_sub,
            creatorSub,
        });
        res.sendStatus(201);
    }
    catch (e) {
        next(e);
    }
}
const getFolderContentsCtr = async (req, res, next) => {
    try {
        const { sub } = req.params;
        const creatorSub = res.locals.userSub;
        const contents = await CardService_1.default.getFolderContents(sub, creatorSub);
        res.json(contents);
    }
    catch (e) {
        next(e);
    }
};
exports.getFolderContentsCtr = getFolderContentsCtr;
const getFolderInfoCtr = async (req, res, next) => {
    try {
        const { sub } = req.params;
        const info = await CardService_1.default.getFolderInfo(sub);
        res.json(info);
    }
    catch (e) {
        next(e);
    }
};
exports.getFolderInfoCtr = getFolderInfoCtr;
async function getFoldersCtr(req, res, next) {
    try {
        const creatorSub = res.locals.userSub;
        const folders = await CardService_1.default.getRootFolders(creatorSub);
        res.status(200).json(folders);
    }
    catch (e) {
        next(e);
    }
}
async function createDeskCtr(req, res, next) {
    try {
        if (!validateCreateDeskDto(req.body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect desk body', {
                errors: validateCreateDeskDto.errors,
            }));
        }
        const { sub, title, description, isPublic, folder_sub } = req.body;
        const creatorSub = res.locals.userSub;
        const deskInfo = await CardService_1.default.createDesk({
            sub,
            title,
            description,
            public: isPublic,
            creatorSub,
            folderSub: folder_sub,
        });
        res.json(deskInfo);
    }
    catch (e) {
        next(e);
    }
}
async function updateDeskCtr(req, res, next) {
    try {
        const params = { sub: req.params.sub };
        const body = {
            title: req.body.title,
            description: req.body.description,
        };
        if (!validateUpdateDeskParamsDto(params)) {
            return next((0, http_errors_1.default)(422, 'Incorrect desk params', {
                errors: validateUpdateDeskParamsDto.errors,
            }));
        }
        if (!validateUpdateDeskBodyDto(body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect desk body', {
                errors: validateUpdateDeskBodyDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        await CardService_1.default.updateDesk({
            deskSub: params.sub,
            body,
            creatorSub,
        });
        res.json({ updated: true });
    }
    catch (e) {
        next(e);
    }
}
async function updateFeedSettingsCtr(req, res, next) {
    try {
        const body = {
            card_orientation: req.body.card_orientation,
        };
        if (!validateUpdateFeedSettingsBodyDto(body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect feed settings body', {
                errors: validateUpdateFeedSettingsBodyDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        await CardService_1.default.updateFeedSettings({
            cardOrientation: body.card_orientation,
            creatorSub,
        });
        res.sendStatus(204);
    }
    catch (e) {
        next(e);
    }
}
async function getCardCtr(req, res, next) {
    try {
        const params = { sub: req.params.sub };
        if (!validateUpdateDeskParamsDto(params)) {
            return next((0, http_errors_1.default)(422, 'Incorrect card params', {
                errors: validateUpdateDeskParamsDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        const result = await CardService_1.default.getCard({
            cardSub: params.sub,
            creatorSub,
        });
        res.json(result);
    }
    catch (e) {
        next(e);
    }
}
async function updateCardCtr(req, res, next) {
    try {
        const params = { sub: req.params.sub };
        const body = {
            front: req.body.front,
            back: req.body.back,
        };
        if (!validateUpdateDeskParamsDto(params)) {
            return next((0, http_errors_1.default)(422, 'Incorrect card params', {
                errors: validateUpdateDeskParamsDto.errors,
            }));
        }
        if (!validateUpdateCardBodyDto(body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect card body', {
                errors: validateUpdateCardBodyDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        await CardService_1.default.updateCard({
            cardSub: params.sub,
            body,
            creatorSub,
        });
        res.json({ updated: true });
    }
    catch (e) {
        next(e);
    }
}
async function deleteCardCtr(req, res, next) {
    try {
        const params = { sub: req.params.sub };
        if (!validateUpdateDeskParamsDto(params)) {
            return next((0, http_errors_1.default)(422, 'Incorrect card params', {
                errors: validateUpdateDeskParamsDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        await CardService_1.default.deleteCard({ cardSub: params.sub, creatorSub });
        res.json({ archived: true });
    }
    catch (e) {
        next(e);
    }
}
async function archivedDeskCtr(req, res, next) {
    try {
        const params = { sub: req.params.sub };
        if (!validateUpdateDeskParamsDto(params)) {
            return next((0, http_errors_1.default)(422, 'Incorrect desk params', {
                errors: validateUpdateDeskParamsDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        await CardService_1.default.archiveDesk({ deskSub: params.sub, creatorSub });
        res.json({ archived: true });
    }
    catch (e) {
        next(e);
    }
}
async function restoreDeskCtr(req, res, next) {
    try {
        const params = { sub: req.params.sub };
        if (!validateUpdateDeskParamsDto(params)) {
            return next((0, http_errors_1.default)(422, 'Incorrect desk params', {
                errors: validateUpdateDeskParamsDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        await CardService_1.default.restoreDesk({ deskSub: params.sub, creatorSub });
        res.sendStatus(204);
    }
    catch (e) {
        next(e);
    }
}
async function updateDeskSettingsCtr(req, res, next) {
    try {
        const params = { sub: req.params.sub };
        const body = {
            cards_per_session: req.body.cards_per_session,
            card_orientation: req.body.card_orientation,
        };
        if (!validateUpdateDeskSettingsParamsDto(params)) {
            return next((0, http_errors_1.default)(422, 'Incorrect desk settings params', {
                errors: validateUpdateDeskSettingsParamsDto.errors,
            }));
        }
        if (!validateUpdateDeskSettingsBodyDto(body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect desk settings body', {
                errors: validateUpdateDeskSettingsBodyDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        await CardService_1.default.updateDeskSettings({
            deskSub: params.sub,
            body,
            creatorSub,
        });
        res.json({ updated: true });
    }
    catch (e) {
        next(e);
    }
}
async function updateReviewSettingsCtr(req, res, next) {
    try {
        const body = {
            cards_per_session: req.body.cards_per_session,
        };
        if (!validateUpdateReviewSettingsBodyDto(body)) {
            return next((0, http_errors_1.default)(422, 'Incorrect review settings body', {
                errors: validateUpdateReviewSettingsBodyDto.errors,
            }));
        }
        const creatorSub = res.locals.userSub;
        await UserService_1.default.existProfile({ sub: creatorSub });
        await CardService_1.default.updateReviewSettings({
            body,
            creatorSub,
        });
        res.sendStatus(204);
    }
    catch (e) {
        next(e);
    }
}
