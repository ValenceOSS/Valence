import type { SaidValues } from './SaidSchema';

type RefusalBody = { error: string; code: string | null; values: SaidValues };

export type { RefusalBody };
