type EpisodePath = {
  isSuccess: boolean;
  seriesName: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  endingEpisodeNumber: number | null;
  isByDate: boolean;
  year: number | null;
  month: number | null;
  day: number | null;
};

type EpisodePathOptions = {
  isDirectory?: boolean;
  isNamed?: boolean;
  isOptimistic?: boolean;
  supportsAbsoluteNumbers?: boolean;
  fillExtendedInfo?: boolean;
};

export type { EpisodePath, EpisodePathOptions };
