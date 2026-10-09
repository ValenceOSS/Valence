import type { TitleEpisode } from '@ValenceClient/requests/seasonsOfTitle';
import type { SearchScope } from '@ValenceContracts/schemas/MediaRequest';

type EpisodeTableProps = {
  label: string;
  season: number;
  episodes: readonly TitleEpisode[];
  onOpenFolder?: (path: string) => void;
  onSearch?: (scope: SearchScope) => void;
  onInteractiveSearch?: (scope: SearchScope) => void;
};

export type { EpisodeTableProps };
