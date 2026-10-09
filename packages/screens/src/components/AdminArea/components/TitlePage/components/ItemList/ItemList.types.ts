import type { MediaRequest, RequestItem } from '@ValenceContracts/schemas/MediaRequest';

type ItemListProps = {
  title: string;
  request: MediaRequest;
  items: readonly RequestItem[];
  isFollowing: boolean;
  onFollow: (item: RequestItem, isFollowed: boolean) => void;
};

export type { ItemListProps };
