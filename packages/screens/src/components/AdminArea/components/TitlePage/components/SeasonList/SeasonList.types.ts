import type { TitleSeason } from '@ValenceClient/requests/seasonsOfTitle';

type SeasonListProps = {
  seasons: readonly TitleSeason[];
  note: string | null;
  isFollowing: boolean;
  onFollow: (season: TitleSeason, isFollowed: boolean) => void;
};

export type { SeasonListProps };
