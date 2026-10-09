type SeriesFile = {
  libraryId: string;
  seriesId: string;
  seriesKey: string;
  path: string;
  season: number;
  episode: number;
  lastEpisode: number | null;
};

export type { SeriesFile };
