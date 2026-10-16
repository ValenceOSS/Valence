import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type SeriesBookListProps = {
  request: Pick<
    MediaRequest,
    'books' | 'items' | 'approval' | 'companionsWanted' | 'keepsOneNarrator' | 'followsNewSeasons'
  >;
  isBusy: boolean;
  onFollowCompanion: (asin: string, isFollowed: boolean) => void;
  onKeepsOneNarrator: (isOn: boolean) => void;
  onFollowsNew: (isOn: boolean) => void;
};

export type { SeriesBookListProps };
