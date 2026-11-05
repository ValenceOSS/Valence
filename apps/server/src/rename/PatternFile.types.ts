type PatternFile = {
  libraryPath: string;
  extension: string;
  title: string;
  year: number | null;
  versionLabel: string | null;
  idTag: string | null;
  series: {
    title: string;
    year: number | null;
    season: number;
    episode: number;
    lastEpisode: number | null;
  } | null;
};

export type { PatternFile };
