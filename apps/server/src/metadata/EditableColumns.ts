type EditableColumns = {
  title: string;
  sortTitle: string | null;
  originalTitle: string | null;
  year: number | null;
  tagline: string | null;
  overview: string | null;
  releaseDate: string | null;
  genres: string[] | null;
  tags: string[] | null;
  studios: string[] | null;
  networks: string[] | null;
  certifications: Record<string, string> | null;
  rating: number | null;
  rottenTomatoes: number | null;
  imdbId: string | null;
  tvdbId: string | null;
  seriesTitle: string | null;
  seriesSortTitle: string | null;
};

type EditScope = 'film' | 'show' | 'episode';

export type { EditableColumns, EditScope };
