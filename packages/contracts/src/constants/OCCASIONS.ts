const OCCASIONS = [
  'valentinesDay',
  'easter',
  'halloween',
  'thanksgiving',
  'christmas',
  'newYearsEve',
] as const;

type Occasion = (typeof OCCASIONS)[number];

export type { Occasion };

export { OCCASIONS };
