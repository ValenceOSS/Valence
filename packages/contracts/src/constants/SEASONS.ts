import type { Occasion } from '@ValenceContracts/constants/OCCASIONS';

const SEASONS = ['halloween', 'christmas'] as const satisfies readonly Occasion[];

type Season = (typeof SEASONS)[number];

export type { Season };

export { SEASONS };
