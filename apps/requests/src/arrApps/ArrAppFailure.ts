import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
import { SaidError } from '@ValenceI18n/SaidError';
import type { Said } from '@ValenceI18n/SaidSchema';

class ArrAppFailure extends SaidError {
  public readonly problemCode: ProblemCode | null;

  public readonly status: number | null;

  public constructor(
    said: Said,
    problemCode: ProblemCode | null = null,
    status: number | null = null,
  ) {
    super(said);
    this.name = 'ArrAppFailure';
    this.problemCode = problemCode;
    this.status = status;
  }
}

export { ArrAppFailure };
