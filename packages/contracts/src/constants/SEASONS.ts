const SEASONS = ['halloween', 'christmas'] as const;

type Season = (typeof SEASONS)[number];

export type { Season };

export { SEASONS };
