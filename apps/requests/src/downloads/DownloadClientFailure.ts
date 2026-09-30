import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
import { SaidError } from '@ValenceI18n/SaidError';
import type { Said } from '@ValenceI18n/SaidSchema';

class DownloadClientFailure extends SaidError {
  public readonly problemCode: ProblemCode | null;

  public constructor(said: Said, problemCode: ProblemCode | null = null) {
    super(said);
    this.name = 'DownloadClientFailure';
    this.problemCode = problemCode;
  }
}

export { DownloadClientFailure };
