class DownloadClientFailure extends Error {
  public constructor(reason: string) {
    super(reason);
    this.name = 'DownloadClientFailure';
  }
}

export { DownloadClientFailure };
