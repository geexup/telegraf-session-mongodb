import { Telegraf, ContextMessageUpdate } from 'telegraf';
import { Db, UpdateWriteOpResult } from 'mongodb';
import { IMongoSessionOptions } from './options.interface';
export declare type MongoSessionContext<TSession = any> = ContextMessageUpdate & {
    saveSession(): Promise<UpdateWriteOpResult>;
    session: TSession;
};
export declare class TelegrafMongoSession<TSession = any> {
    private db;
    private collection;
    private options;
    constructor(db: Db, options?: Partial<IMongoSessionOptions>);
    getKey(ctx: any): string;
    saveSession(key: string, session: TSession): Promise<UpdateWriteOpResult>;
    getSession(key: string): Promise<{}>;
    middleware(ctx: any, next: Function): Promise<any>;
    static setup<TSessionName = 'session'>(bot: Telegraf<ContextMessageUpdate>, mongo_url: string, params?: Partial<IMongoSessionOptions>): void;
}
export declare const middleware: (db: any, options?: {}) => (ctx: any, next: Function) => Promise<any>;
