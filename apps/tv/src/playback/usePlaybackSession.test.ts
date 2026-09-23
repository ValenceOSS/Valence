import { act, renderHook } from '@testing-library/react-native';
import {
  heartbeatPlaybackSession,
  sendPresenceHeartbeat,
  startPlaybackSession,
  stopPlaybackSession,
  stopWatching,
} from '@ValenceClient/playback/startPlaybackSession';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import { usePlaybackSession } from '@ValenceTv/playback/usePlaybackSession';
import type { StartOutcome, StartedSession } from '@ValenceClient/playback/startPlaybackSession';

jest.mock('@ValenceClient/playback/startPlaybackSession', () => ({
  startPlaybackSession: jest.fn(),
  stopPlaybackSession: jest.fn(() => Promise.resolve()),
  stopWatching: jest.fn(() => Promise.resolve()),
  heartbeatPlaybackSession: jest.fn(() => Promise.resolve()),
  sendPresenceHeartbeat: jest.fn(() => Promise.resolve()),
}));

const MEDIA = '00000000-0000-4000-8000-000000000001';

const REASON = { code: 'ClientSupportsSource', detail: 'Plays as it is' } as const;

const aSession = (delivery: StartedSession['delivery']): StartedSession => ({
  sessionId: 'session-1',
  delivery,
  mode: 'direct',
  plan: {
    mediaId: MEDIA,
    container: { kind: 'passthrough', reason: REASON },
    video: { kind: 'passthrough', reason: REASON },
    audio: { kind: 'passthrough', streamIndex: null, reason: REASON },
    subtitles: { kind: 'none', reason: REASON },
  },
  warnings: [],
  reuse: null,
});

const HLS = aSession({ kind: 'hls', manifestUrl: '/api/playback/session-1/master.m3u8' });

const DIRECT = aSession({ kind: 'direct', url: '/api/media/1/file' });

const starting = (outcome: StartOutcome): void => {
  jest.mocked(startPlaybackSession).mockResolvedValue(outcome);
};

const settle = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  rememberServerAddress('http://valence.local:3000');
  keepTheSessionToken('secret');
});

afterEach(() => {
  jest.useRealTimers();
});

describe('usePlaybackSession', () => {
  it('starts as starting, asking with the television’s profile from the whole second', async () => {
    jest.mocked(startPlaybackSession).mockReturnValue(new Promise<StartOutcome>(() => undefined));

    const { result } = await renderHook(() => usePlaybackSession(MEDIA, 90.7, () => true, 2));

    expect(result.current).toEqual({ kind: 'starting' });
    expect(startPlaybackSession).toHaveBeenCalledWith(
      MEDIA,
      expect.objectContaining({ name: 'Apple TV' }),
      'client-1',
      90,
      2,
      undefined,
    );
  });

  it('opens a converted stream on the server as whoever is signed in', async () => {
    starting({ kind: 'started', session: HLS });

    const { result } = await renderHook(() => usePlaybackSession(MEDIA, 0, () => true));

    await settle();

    expect(result.current).toEqual({
      kind: 'ready',
      source: {
        uri: 'http://valence.local:3000/api/playback/session-1/master.m3u8',
        headers: { authorization: 'Bearer secret' },
        contentType: 'hls',
      },
      started: HLS,
    });
  });

  it('opens a file sent as it is without saying it is HLS', async () => {
    starting({ kind: 'started', session: DIRECT });

    const { result } = await renderHook(() => usePlaybackSession(MEDIA, 0, () => true));

    await settle();

    expect(result.current).toMatchObject({
      kind: 'ready',
      source: { uri: 'http://valence.local:3000/api/media/1/file', contentType: 'auto' },
    });
  });

  it('says why the server would not play it', async () => {
    starting({ kind: 'failed', reason: 'Not allowed' });

    const { result } = await renderHook(() => usePlaybackSession(MEDIA, 0, () => true));

    await settle();

    expect(result.current).toEqual({ kind: 'failed', reason: 'Not allowed' });
  });

  it('keeps a converted session and the household told the player is still there', async () => {
    starting({ kind: 'started', session: HLS });

    let isPlaying = true;

    await renderHook(() => usePlaybackSession(MEDIA, 0, () => isPlaying));
    await settle();

    isPlaying = false;
    jest.advanceTimersByTime(30_000);

    expect(heartbeatPlaybackSession).toHaveBeenCalledWith('session-1', false, 'client-1');
    expect(sendPresenceHeartbeat).toHaveBeenCalledTimes(2);
    expect(sendPresenceHeartbeat).toHaveBeenLastCalledWith('client-1', false);
  });

  it('does not keep a file sent as it is alive, but still tells the household', async () => {
    starting({ kind: 'started', session: DIRECT });

    await renderHook(() => usePlaybackSession(MEDIA, 0, () => true));
    await settle();

    jest.advanceTimersByTime(30_000);

    expect(heartbeatPlaybackSession).not.toHaveBeenCalled();
    expect(sendPresenceHeartbeat).toHaveBeenCalledTimes(2);
  });

  it('ends the session and the watching when the player goes', async () => {
    starting({ kind: 'started', session: HLS });

    const { unmount } = await renderHook(() => usePlaybackSession(MEDIA, 0, () => true));

    await settle();
    await unmount();
    jest.advanceTimersByTime(60_000);

    expect(stopPlaybackSession).toHaveBeenCalledWith('session-1', 'client-1');
    expect(stopWatching).toHaveBeenCalledWith('client-1');
    expect(heartbeatPlaybackSession).not.toHaveBeenCalled();
    expect(sendPresenceHeartbeat).not.toHaveBeenCalled();
  });

  it('ends a session that opens after the player has already gone', async () => {
    let open: (outcome: StartOutcome) => void = () => undefined;

    jest.mocked(startPlaybackSession).mockReturnValue(
      new Promise<StartOutcome>((resolve) => {
        open = resolve;
      }),
    );

    const { result, unmount } = await renderHook(() => usePlaybackSession(MEDIA, 0, () => true));

    await unmount();
    open({ kind: 'started', session: HLS });
    await settle();

    expect(stopPlaybackSession).toHaveBeenCalledWith('session-1', 'client-1');
    expect(result.current).toEqual({ kind: 'starting' });
  });

  it('starts a new session when another sound track is chosen', async () => {
    starting({ kind: 'started', session: HLS });

    const { rerender } = await renderHook(
      ({ audio }: { audio: number }) => usePlaybackSession(MEDIA, 0, () => true, audio),
      { initialProps: { audio: 1 } },
    );

    await settle();
    await rerender({ audio: 2 });

    expect(startPlaybackSession).toHaveBeenCalledTimes(2);
    expect(stopPlaybackSession).toHaveBeenCalledWith('session-1', 'client-1');
  });
});
