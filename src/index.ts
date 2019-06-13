import { Telegraf, ContextMessageUpdate } from 'telegraf';
import { MongoClient, Db, Collection, UpdateWriteOpResult } from 'mongodb';
import { IMongoSessionOptions, IMongoSessionDataCollection } from './options.interface';

const SAVE_SESSION_FUNCTION = 'saveSession';
const SAVE_SESSION_PROPERTY = 'session';

export type MongoSessionContext<TSession = any> = ContextMessageUpdate & {
  saveSession(): Promise<UpdateWriteOpResult>;
  session: TSession;
};

export class TelegrafMongoSession<TSession = any> {
  private collection: Collection<IMongoSessionDataCollection<TSession>>;
  private options: IMongoSessionOptions;

  constructor(
    private db: Db,
    options: Partial<IMongoSessionOptions> = {}
  ) {
    this.options = Object.assign({
      collectionName: 'sessions'
    }, options);

    this.collection = db.collection(this.options.collectionName);
  }

  getKey(ctx): string {
    return `${ctx.chat.id}:${ctx.from.id}`;
  }

  async saveSession(key: string, session: TSession): Promise<UpdateWriteOpResult> {
    return await this.collection.updateOne({
      key: key
    }, {
      $set: { data: session }
    }, {
      upsert: true
    });
  }

  async getSession(key: string) {
    const doc = await this.collection.findOne({ key: key });
    return doc ? doc.data : {};
  }

  async middleware(ctx, next: Function) {
    if (!ctx.chat || !ctx.from) return await next();

    const key = this.getKey(ctx);
    const session = await this.getSession(key);
    const saveSession = () => this.saveSession(key, ctx[SAVE_SESSION_PROPERTY] || {});

    ctx[SAVE_SESSION_PROPERTY] = session;
    ctx[SAVE_SESSION_FUNCTION] = saveSession;

    await next();
    await saveSession();
  }

  static setup<TSessionName = 'session'>(bot: Telegraf<ContextMessageUpdate>, mongo_url: string, params?: Partial<IMongoSessionOptions>) {
    let session;
    bot.use((...args) => session.middleware(...args));
    MongoClient.connect(mongo_url, { useNewUrlParser: true }).then((client) => {
      const db = client.db();
      session = new TelegrafMongoSession<TSessionName>(db, params);
    }).catch((reason) => {
      console.log('telegraf-session-mongodb: failed to connect to the database, session saving will not work.')
      console.log(reason);

      session = { middleware: function(ctx, next) { next(); } }
    });
  }
}

export const middleware = (db, options = {}) => {
  const telegrafSession = new TelegrafMongoSession(db, options);
  return telegrafSession.middleware;
}
