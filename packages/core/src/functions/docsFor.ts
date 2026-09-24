import { DOCS_ADDRESS } from '@ValenceContracts/constants/DOCS_ADDRESS';
import { PROBLEM_DOCS } from '@ValenceContracts/constants/PROBLEM_DOCS';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';

/**
 * Where the documentation gives the steps that put a problem right, for a problem that has them.
 *
 * @param code - The problem, or nothing where it has no code.
 * @returns The address of the steps, or nothing where there are none.
 */
const docsFor = (code: ProblemCode | null | undefined): string | null => {
  const path = code === null || code === undefined ? undefined : PROBLEM_DOCS[code];

  return path === undefined ? null : `${DOCS_ADDRESS}${path}`;
};

export { docsFor };
