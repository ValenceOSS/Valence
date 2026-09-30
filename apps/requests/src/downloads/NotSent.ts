import type { Said } from '@ValenceI18n/SaidSchema';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';

type NotSent = { refused: Said; problemCode: ProblemCode | null };

export type { NotSent };
