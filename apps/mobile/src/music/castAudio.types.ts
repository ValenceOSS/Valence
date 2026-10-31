import type {
  MediaLoadRequest,
  MediaQueueItem,
  MediaSeekOptions,
  MediaStatus,
} from 'react-native-google-cast';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type CastClient = {
  onMediaStatusUpdated: (handler: (status: MediaStatus | null) => void) => { remove: () => void };
  loadMedia: (request: MediaLoadRequest) => Promise<void>;
  queueInsertItem: (item: MediaQueueItem) => Promise<void>;
  getStreamPosition: () => Promise<number | null>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (options: MediaSeekOptions) => Promise<void>;
  setStreamMuted: (muted: boolean) => Promise<void>;
};

type CastAudioOptions = {
  describe: (trackId: string) => MusicTrack | null;
  onLost: () => void;
  everyMs?: number;
};

export type { CastAudioOptions, CastClient };
