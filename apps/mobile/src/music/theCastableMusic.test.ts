import { waitFor } from '@testing-library/react-native';
import { theCastableMusic } from './theCastableMusic';

const mockShowCastDialog = jest.fn(() => Promise.resolve(true));
const mockEnd = jest.fn(() => Promise.resolve());
const mockHeard = new Map<
  string,
  (session: { client: object; getCastDevice: () => Promise<object> }) => void
>();
let mockSession: object | null = null;

jest.mock('react-native-google-cast', () => ({
  __esModule: true,
  default: {
    showCastDialog: () => mockShowCastDialog(),
    getSessionManager: () => ({
      onSessionStarted: (handler: () => void) => {
        mockHeard.set('started', handler);

        return { remove: () => undefined };
      },
      onSessionEnded: (handler: () => void) => {
        mockHeard.set('ended', handler);

        return { remove: () => undefined };
      },
      getCurrentCastSession: () => Promise.resolve(mockSession),
      endCurrentSession: () => mockEnd(),
    }),
  },
  MediaPlayerState: { PLAYING: 'playing', PAUSED: 'paused', IDLE: 'idle' },
  MediaPlayerIdleReason: { FINISHED: 'finished', ERROR: 'error' },
}));

/**
 * A device's session for a test, with a media client that does nothing.
 *
 * @returns The session.
 */
const aSession = () => ({
  client: {
    onMediaStatusUpdated: () => ({ remove: () => undefined }),
    loadMedia: () => Promise.resolve(),
    queueInsertItem: () => Promise.resolve(),
    getStreamPosition: () => Promise.resolve(null),
    play: () => Promise.resolve(),
    pause: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    seek: () => Promise.resolve(),
    setStreamMuted: () => Promise.resolve(),
  },
  getCastDevice: () => Promise.resolve({ friendlyName: 'Living Room' }),
});

beforeEach(() => {
  mockShowCastDialog.mockClear();
});

afterEach(() => {
  theCastableMusic().release?.();
  mockSession = null;
});

describe('theCastableMusic', () => {
  it('opens the system’s list of devices, and casts to the one chosen', async () => {
    const music = theCastableMusic();

    music.castTheMusic();

    await waitFor(() => {
      expect(mockShowCastDialog).toHaveBeenCalled();
    });

    mockHeard.get('started')?.(aSession());

    await waitFor(() => {
      expect(music.castingTo()).toBe('Living Room');
    });

    mockHeard.get('ended')?.(aSession());

    expect(music.castingTo()).toBeNull();
  });

  it('casts straight to a device already connected', async () => {
    mockSession = aSession();

    const music = theCastableMusic();

    music.castTheMusic();

    await waitFor(() => {
      expect(music.castingTo()).toBe('Living Room');
    });
    expect(mockShowCastDialog).not.toHaveBeenCalled();
  });

  it('leaves a device connected for a film to the film', () => {
    const music = theCastableMusic();

    mockHeard.get('started')?.(aSession());

    expect(music.castingTo()).toBeNull();
  });

  it('ends the cast when asked', () => {
    theCastableMusic().stopCasting();

    expect(mockEnd).toHaveBeenCalled();
  });
});
