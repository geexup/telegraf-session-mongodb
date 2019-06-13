export interface IMongoSessionOptions {
  /** Collection name in MongoDB */
  collectionName: string;
}

export interface IMongoSessionDataCollection<TSession> {
  data: TSession;
}
