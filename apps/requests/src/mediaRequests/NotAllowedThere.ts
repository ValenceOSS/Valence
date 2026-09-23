class NotAllowedThere extends Error {
  public constructor(folder: string, runningAs: string) {
    super(
      `The requests service, running as ${runningAs}, may not write to ${folder}. Set PUID and PGID on it to the owner of your media folders.`,
    );
    this.name = 'NotAllowedThere';
  }
}

export { NotAllowedThere };
