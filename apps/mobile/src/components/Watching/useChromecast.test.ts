import { renderHook, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { useChromecast } from './useChromecast';
import type { AChromecastAsk } from './useChromecast.types';

const mockShowCastDialog = jest.fn(() => Promise.resolve(true));
const mockLoadMedia = jest.fn<
  Promise<void>,
  [{ startTime?: number; mediaInfo: { contentUrl: string } }]
>(() => Promise.resolve());
const mockStart = jest.fn((..._asked: Array<string | number | boolean | object | undefined>) =>
  Promise.resolve({
    kind: 'started',
    session: { sessionId: 's-1', delivery: { kind: 'hls', manifestUrl: '/own.m3u8' } },
  }),
);
const mockStop = jest.fn((_sessionId: string, _clientId?: string) => Promise.resolve());
const mockEndSession = jest.fn(() => Promise.resolve());
let mockIsConnected = false;

jest.mock('react-native-google-cast', () => ({
  __esModule: true,
  default: {
    showCastDialog: () => mockShowCastDialog(),
    getSessionManager: () => ({ endCurrentSession: () => mockEndSession() }),
  },
  CastState: {
    NO_DEVICES_AVAILABLE: 'noDevicesAvailable',
    NOT_CONNECTED: 'notConnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
  },
  MediaPlayerState: { PLAYING: 'playing', PAUSED: 'paused' },
  useCastState: () => (mockIsConnected ? 'connected' : 'notConnected'),
  useCastDevice: () => (mockIsConnected ? { friendlyName: 'Living Room' } : null),
  useRemoteMediaClient: () => (mockIsConnected ? { loadMedia: mockLoadMedia } : null),
  useMediaStatus: () => null,
  useStreamPosition: () => null,
}));
jest.mock('@ValenceClient/playback/startPlaybackSession', () => ({
  startPlaybackSession: (...asked: Array<string | number | boolean | object | undefined>) =>
    mockStart(...asked),
  stopPlaybackSession: (sessionId: string, clientId?: string) => mockStop(sessionId, clientId),
  heartbeatPlaybackSession: () => Promise.resolve('alive'),
}));
jest.mock('@ValenceClient/playback/castAddressOf', () => ({
  castAddressOf: () => Promise.resolve('/api/playback/cast/t/index.m3u8'),
}));

/**
 * What a film playing on the phone asks of a cast.
 *
 * @param overrides - What differs from the film.
 * @returns The ask.
 */
const anAsk = (overrides: Partial<AChromecastAsk> = {}): AChromecastAsk => ({
  mediaId: 'arrival',
  title: 'Arrival',
  artwork: null,
  clientId: 'phone',
  audioStreamIndex: undefined,
  quality: undefined,
  burnInSubtitleId: 'sub-1',
  isKept: false,
  startsAt: () => 600,
  onTaken: jest.fn(),
  onGivenBack: jest.fn(),
  onRefused: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  mockIsConnected = false;
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

describe('useChromecast', () => {
  it('opens the system’s list of devices when asked', async () => {
    const { result } = await renderHook(() => useChromecast(anAsk()));

    result.current.choose();

    expect(mockShowCastDialog).toHaveBeenCalled();
    expect(result.current.isCasting).toBe(false);
  });

  it('hands the device a stream of its own from where they were, with the words drawn in', async () => {
    const onTaken = jest.fn();

    mockIsConnected = true;

    const { result } = await renderHook(() => useChromecast(anAsk({ onTaken })));

    await waitFor(() => {
      expect(onTaken).toHaveBeenCalled();
    });

    const [, , , from, , , , , burnIn, isCast] = mockStart.mock.calls[0] ?? [];
    const loaded = mockLoadMedia.mock.calls[0]?.[0];

    expect(from).toBe(600);
    expect(burnIn).toBe('sub-1');
    expect(isCast).toBe(true);
    expect(loaded?.startTime).toBe(600);
    expect(loaded?.mediaInfo.contentUrl).toBe(
      'http://one.local:8420/api/playback/cast/t/index.m3u8',
    );
    await waitFor(() => {
      expect(result.current.deviceName).toBe('Living Room');
    });
    expect(result.current.isCasting).toBe(true);
  });

  it('is not casting where the device would not take it, and lets the device go', async () => {
    const onRefused = jest.fn();

    mockIsConnected = true;
    mockLoadMedia.mockRejectedValueOnce(new Error('refused'));

    const { result } = await renderHook(() => useChromecast(anAsk({ onRefused })));

    await waitFor(() => {
      expect(onRefused).toHaveBeenCalled();
    });
    expect(result.current.isCasting).toBe(false);
    expect(mockStop).toHaveBeenCalledWith('s-1', 'phone');
    expect(mockEndSession).toHaveBeenCalled();
  });
});
