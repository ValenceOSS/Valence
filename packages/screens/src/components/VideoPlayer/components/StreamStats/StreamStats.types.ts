import type { PointerEvent } from 'react';
import type { DeliveredFormat } from '@ValenceScreens/playback/attachShaka';
import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import type { MediaDetail, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { EngineStats } from '@ValenceScreens/playback/engine/EngineStats';

type PlaybackHealth = {
  positionSeconds: number;
  frameSeconds: number;
  streamFromSeconds: number;
  bufferedAheadSeconds: number;
  encodedSeconds: number;
  droppedFrames: number | null;
  decodedFrames: number | null;
  presentedWidth: number;
  presentedHeight: number;
};

type PartyHealth = {
  isPlaying: boolean;
  isHeld: boolean;
  waitingFor: readonly string[];
  referenceSeconds: number | null;
  jitterMs: number;
  members: number;
};

type StatsReading = {
  connectionKbps: number | null;
  bitrateKbps: number | null;
  bufferedAheadSeconds: number;
};

type StreamStatsProps = {
  media: Pick<MediaSummary, 'id' | 'title' | 'durationSeconds'>;
  session: StartedSession | null;
  detail: MediaDetail | null;
  health: PlaybackHealth;
  delivered: DeliveredFormat | null;
  engine?: EngineStats | null;
  sessionStartSeconds: number;
  history?: readonly StatsReading[];
  party?: PartyHealth;
  onClose: () => void;
  onGrab?: (event: PointerEvent<HTMLElement>) => void;
};

export type { PlaybackHealth, PartyHealth, StatsReading, StreamStatsProps };
