import type { SequencedCommand } from '@ValenceContracts/schemas/WatchParty';

type PartyPlayback = {
  id: string;
  command: SequencedCommand | null;
  meConnectionId: string | null;
  referenceSeconds: number | null;
  jitterMs: number;
  isPlaying: boolean;
  isHeld: boolean;
  waitingFor: readonly string[];
  members: number;
  onReport: (where: {
    positionSeconds: number;
    bufferedAheadSeconds: number;
    isWatching: boolean;
    isReady: boolean;
  }) => void;
  onCommand: (command: { kind: 'play' | 'pause' | 'seek'; atSeconds: number }) => void;
};

export type { PartyPlayback };
