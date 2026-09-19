class IndexerFailure extends Error {
  public constructor(reason: string) {
    super(reason);
    this.name = 'IndexerFailure';
  }
}

export { IndexerFailure };
