"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const SAVE_SESSION_FUNCTION = 'saveSession';
const SAVE_SESSION_PROPERTY = 'session';
class TelegrafMongoSession {
    constructor(db, options = {}) {
        this.db = db;
        this.options = Object.assign({
            collectionName: 'sessions'
        }, options);
        this.collection = db.collection(this.options.collectionName);
    }
    getKey(ctx) {
        return `${ctx.chat.id}:${ctx.from.id}`;
    }
    saveSession(key, session) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.updateOne({
                key: key
            }, {
                $set: { data: session }
            }, {
                upsert: true
            });
        });
    }
    getSession(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.collection.findOne({ key: key });
            return doc ? doc.data : {};
        });
    }
    middleware(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ctx.chat || !ctx.from)
                return yield next();
            const key = this.getKey(ctx);
            const session = yield this.getSession(key);
            const saveSession = () => this.saveSession(key, ctx[SAVE_SESSION_PROPERTY] || {});
            ctx[SAVE_SESSION_PROPERTY] = session;
            ctx[SAVE_SESSION_FUNCTION] = saveSession;
            yield next();
            yield saveSession();
        });
    }
    static setup(bot, mongo_url, params) {
        let session;
        bot.use((...args) => session.middleware(...args));
        mongodb_1.MongoClient.connect(mongo_url, { useNewUrlParser: true }).then((client) => {
            const db = client.db();
            session = new TelegrafMongoSession(db, params);
        }).catch((reason) => {
            console.log('telegraf-session-mongodb: failed to connect to the database, session saving will not work.');
            console.log(reason);
            session = { middleware: function (ctx, next) { next(); } };
        });
    }
}
exports.TelegrafMongoSession = TelegrafMongoSession;
exports.middleware = (db, options = {}) => {
    const telegrafSession = new TelegrafMongoSession(db, options);
    return telegrafSession.middleware;
};
