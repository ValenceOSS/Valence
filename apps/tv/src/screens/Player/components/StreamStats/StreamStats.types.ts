import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';

type StreamReading = {
  positionSeconds: number;
  bufferedSeconds: number;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  bitrate: number | null;
  frameRate: number | null;
  range: string | null;
};

type StreamStatsProps = {
  title: string;
  mediaId: string;
  detail: MediaDetail | null;
  session: StartedSession | null;
  sessionStartSeconds: number;
  quality: string;
  reading: StreamReading;
};

export type { StreamReading, StreamStatsProps };
