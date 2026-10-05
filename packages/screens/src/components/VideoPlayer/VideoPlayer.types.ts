import type { ReactNode } from 'react';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { PartyPlayback } from '@ValenceClient/party/PartyPlayback';

type VideoPlayerProps = {
  media: Pick<MediaSummary, 'id' | 'title' | 'durationSeconds'> &
    Partial<
      Pick<
        MediaSummary,
        | 'seriesTitle'
        | 'seasonNumber'
        | 'episodeNumber'
        | 'hasPoster'
        | 'year'
        | 'releaseDate'
        | 'extraKind'
      >
    >;
  isImmersive?: boolean;
  startSeconds?: number;
  onClose: () => void;
  onProgress?: (positionSeconds: number, durationSeconds: number) => void;
  onEnded?: () => void;
  onStopped?: () => void;
  episodes?: MediaSummary[];
  onSelectEpisode?: (episode: MediaSummary) => void;
  willCarryOn?: boolean;
  watchedFractionFor?: (mediaId: string) => number | undefined;
  party?: PartyPlayback;
  partyNotice?: string | null;
  renderPartyMenu?: (options: {
    isHidden: boolean;
    onOpenChange: (isOpen: boolean) => void;
  }) => ReactNode;
  keptDownloadId?: string;
};

type PlayerState = 'starting' | 'playing' | 'failed';

export type { PlayerState, VideoPlayerProps };
