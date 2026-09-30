import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
import { SaidError } from '@ValenceI18n/SaidError';
import type { Said } from '@ValenceI18n/SaidSchema';

class IndexerFailure extends SaidError {
  public readonly problemCode: ProblemCode | null;

  public constructor(said: Said, problemCode: ProblemCode | null = null) {
    super(said);
    this.name = 'IndexerFailure';
    this.problemCode = problemCode;
  }
}

export { IndexerFailure };
