class SelectorMiss extends Error {
  public constructor(what: string) {
    super(`Nothing matched ${what}`);
    this.name = 'SelectorMiss';
  }
}

export { SelectorMiss };
