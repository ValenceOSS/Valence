import { MediaPlayerState } from 'react-native-google-cast';
import type { MediaLoadRequest, MediaStatus } from 'react-native-google-cast';
import type { CastClient } from '@ValenceMobile/music/castAudio.types';

/**
 * A Chromecast's media client for a test, which remembers what it was asked and says whatever
 * status the test hands it.
 *
 * @returns The client, and a way to have it say a status.
 */
const aFakeCastClient = () => {
  let heard: ((status: MediaStatus | null) => void) | null = null;

  const client = {
    onMediaStatusUpdated: jest.fn((handler: (status: MediaStatus | null) => void) => {
      heard = handler;

      return { remove: jest.fn() };
    }),
    loadMedia: jest.fn((_request: MediaLoadRequest) => Promise.resolve()),
    queueInsertItem: jest.fn(() => Promise.resolve()),
    getStreamPosition: jest.fn(() => Promise.resolve(null)),
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    seek: jest.fn(() => Promise.resolve()),
    setStreamMuted: jest.fn(() => Promise.resolve()),
  } satisfies CastClient;

  const say = (contentId: string, change: Partial<MediaStatus> = {}): void => {
    heard?.({
      isMuted: false,
      playbackRate: 1,
      playerState: MediaPlayerState.PLAYING,
      queueItems: [],
      streamPosition: 0,
      volume: 1,
      mediaInfo: { contentId, contentUrl: contentId, streamDuration: 300 },
      ...change,
    });
  };

  return { client, say };
};

export { aFakeCastClient };
