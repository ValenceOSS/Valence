type SubtitleLookup = {
  kind: 'movie' | 'episode';
  tmdbId: number | null;
  imdbId: string | null;
  season: number | null;
  episode: number | null;
  hash: string | null;
  language: string;
};

export type { SubtitleLookup };
