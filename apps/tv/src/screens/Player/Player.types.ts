import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';

type PlayerProps = {
  mediaId: string;
  startSeconds: number;
  carriedOn: number;
  onLeave: () => void;
  onNext: (episode: MediaSummary, carriedOn: number) => void;
  watchParty?: WatchPartyState;
};

export type { PlayerProps };
