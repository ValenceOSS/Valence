import type { TitleSeason } from '@ValenceClient/requests/seasonsOfTitle';
import type { SearchScope } from '@ValenceContracts/schemas/MediaRequest';

type SeasonListProps = {
  seasons: readonly TitleSeason[];
  isFollowing: boolean;
  onFollow: (season: TitleSeason, isFollowed: boolean) => void;
  followsNew?: boolean | null;
  onFollowsNew?: (isOn: boolean) => void;
  onOpenFolder?: (path: string) => void;
  onSearch?: (scope: SearchScope) => void;
  onInteractiveSearch?: (scope: SearchScope) => void;
};

export type { SeasonListProps };
