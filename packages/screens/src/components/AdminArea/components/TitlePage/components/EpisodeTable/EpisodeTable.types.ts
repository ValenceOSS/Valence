import type { TitleEpisode } from '@ValenceClient/requests/seasonsOfTitle';

type EpisodeTableProps = {
  label: string;
  episodes: readonly TitleEpisode[];
};

export type { EpisodeTableProps };
