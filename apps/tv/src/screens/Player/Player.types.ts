import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';

type PlayerProps = {
  mediaId: string;
  startSeconds: number;
  carriedOn: number;
  subtitleLanguage?: string;
  audioLanguage?: string;
  onLeave: () => void;
  onNext: (episode: MediaSummary, carriedOn: number) => void;
  watchParty?: WatchPartyState;
};

type StoppedBy = { problem: PlaybackProblem; cause: string | null };

export type { PlayerProps, StoppedBy };
