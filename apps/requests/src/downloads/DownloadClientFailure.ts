import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';

class DownloadClientFailure extends Error {
  public readonly problemCode: ProblemCode | null;

  public constructor(reason: string, problemCode: ProblemCode | null = null) {
    super(reason);
    this.name = 'DownloadClientFailure';
    this.problemCode = problemCode;
  }
}

export { DownloadClientFailure };
