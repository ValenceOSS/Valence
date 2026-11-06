type NfoTitle = {
  kind: 'movie' | 'tvshow' | 'episodedetails';
  title: string;
  originalTitle: string | null;
  sortTitle: string | null;
  year: number | null;
  plot: string | null;
  tagline: string | null;
  premiered: string | null;
  rating: number | null;
  genres: readonly string[];
  tags: readonly string[];
  studios: readonly string[];
  directors: readonly string[];
  writers: readonly string[];
  cast: readonly { name: string; role: string }[];
  season: number | null;
  episode: number | null;
  ids: { tmdb: string | null; imdb: string | null; tvdb: string | null };
};

export type { NfoTitle };
