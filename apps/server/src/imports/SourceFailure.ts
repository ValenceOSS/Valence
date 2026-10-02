import { SaidError } from '@ValenceI18n/SaidError';
import type { Said } from '@ValenceI18n/SaidSchema';

class SourceFailure extends SaidError {
  public readonly status: number | null;

  public constructor(said: Said, status: number | null = null) {
    super(said);
    this.name = 'SourceFailure';
    this.status = status;
  }
}

export { SourceFailure };
