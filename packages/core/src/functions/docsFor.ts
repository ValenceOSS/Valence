import { DOCS_ADDRESS } from '@ValenceContracts/constants/DOCS_ADDRESS';
import { PROBLEM_DOCS } from '@ValenceContracts/constants/PROBLEM_DOCS';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';

/**
 * Where the documentation explains a problem and how to put it right.
 *
 * @param code - The problem, or nothing where it has no code.
 * @returns The address of the section about it, or nothing.
 */
const docsFor = (code: ProblemCode | null | undefined): string | null =>
  code === null || code === undefined ? null : `${DOCS_ADDRESS}${PROBLEM_DOCS[code]}`;

export { docsFor };
