import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';

type WatchingProps = {
  mediaId: string;
  startSeconds?: number;
  onDone: () => void;
  onEnded?: () => void;
  seasons?: readonly { seasonNumber: number | null; episodes: readonly MediaSummary[] }[];
  onChooseEpisode?: (mediaId: string) => void;
  willCarryOn?: boolean;
  kept?: HeldFile;
  watchParty?: WatchPartyState;
};

type StoppedBy = { problem: PlaybackProblem; cause: string | null };

export type { StoppedBy, WatchingProps };
