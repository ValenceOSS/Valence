import type { TitleEpisode, TitleSeason } from '@ValenceClient/requests/seasonsOfTitle';
import type { SearchScope } from '@ValenceContracts/schemas/MediaRequest';
import type { ActionMenuItem } from '@ValenceUI/ActionMenu.types';

type SeasonListProps = {
  seasons: readonly TitleSeason[];
  isFollowing?: boolean;
  onFollow?: (season: TitleSeason, isFollowed: boolean) => void;
  followsNew?: boolean | null;
  onFollowsNew?: (isOn: boolean) => void;
  onOpenFolder?: (path: string) => void;
  onSearch?: (scope: SearchScope) => void;
  onInteractiveSearch?: (scope: SearchScope) => void;
  actionsOf?: (season: TitleSeason) => ActionMenuItem[];
  onOpenEpisode?: (season: TitleSeason, episode: TitleEpisode) => void;
  openSeason?: number | null;
  onOpenSeason?: (season: number | null) => void;
};

export type { SeasonListProps };
