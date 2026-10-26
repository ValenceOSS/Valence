type TitleKind = 'film' | 'series';

type Likeness = {
  genres: number[];
  keywords: number[];
  cast: number[];
  crew: number[];
  recommendations: number[];
};

export type { Likeness, TitleKind };
