import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';

class IndexerFailure extends Error {
  public readonly problemCode: ProblemCode | null;

  public constructor(reason: string, problemCode: ProblemCode | null = null) {
    super(reason);
    this.name = 'IndexerFailure';
    this.problemCode = problemCode;
  }
}

export { IndexerFailure };
