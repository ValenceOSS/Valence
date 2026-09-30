import type { Said } from './SaidSchema';

class SaidError extends Error {
  public readonly said: Said;

  public constructor(said: Said) {
    super(said.message);
    this.name = 'SaidError';
    this.said = said;
  }
}

export { SaidError };
