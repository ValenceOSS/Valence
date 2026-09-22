import { act, render, userEvent, waitFor } from '@testing-library/react-native';
import {
  heartbeatPlaybackSession,
  startPlaybackSession,
  stopPlaybackSession,
  stopWatching,
} from '@ValenceClient/playback/startPlaybackSession';
import { reportWatchProgress } from '@ValenceClient/playback/watchProgress';
import { theFakePlayer } from '@ValencePhone/testing/theFakePlayer';
import { Watching } from './Watching';
import type { StartedSession, StartOutcome } from '@ValenceClient/playback/startPlaybackSession';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';

jest.mock('@ValenceClient/playback/startPlaybackSession');

jest.mock('@ValenceClient/playback/watchProgress', () => ({
  REPORT_EVERY_MILLISECONDS: 10_000,
  reportWatchProgress: jest.fn(),
}));

const reason = { code: 'ClientSupportsSource', detail: 'Client declares support' } as const;

const A_PLAN: PlaybackPlan = {
  mediaId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  container: { kind: 'passthrough', reason },
  video: { kind: 'passthrough', reason },
  audio: { kind: 'passthrough', streamIndex: 1, reason },
  subtitles: { kind: 'none', reason },
};

const started = (delivery: StartedSession['delivery']): StartOutcome => ({
  kind: 'started',
  session: {
    sessionId: 'a-session',
    delivery,
    mode: 'Direct play',
    plan: A_PLAN,
    warnings: [],
    reuse: null,
  },
});

const refused = (why: string): StartOutcome => ({ kind: 'failed', reason: why });

beforeEach(() => {
  jest.mocked(startPlaybackSession).mockReset();
  jest.mocked(stopPlaybackSession).mockReset().mockResolvedValue();
  jest.mocked(stopWatching).mockReset().mockResolvedValue();
  jest.mocked(heartbeatPlaybackSession).mockReset().mockResolvedValue();
  jest.mocked(reportWatchProgress).mockReset().mockResolvedValue();
  theFakePlayer.currentTime = 420;
  theFakePlayer.duration = 6960;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Watching', () => {
  it('says it is asking, rather than showing a black rectangle', async () => {
    jest.mocked(startPlaybackSession).mockReturnValue(new Promise(() => undefined));

    const drawn = await render(<Watching mediaId="one" onDone={jest.fn()} />);

    expect(drawn.getByText('Asking the server for this one…')).toBeTruthy();
  });

  it('tells the server what this phone can decode', async () => {
    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(
        started({ kind: 'hls', manifestUrl: '/api/playback/a-session/master.m3u8' }),
      );

    await render(<Watching mediaId="a-film" onDone={jest.fn()} />);

    await waitFor(() => {
      expect(startPlaybackSession).toHaveBeenCalledWith(
        'a-film',
        expect.objectContaining({ schemaVersion: 1 }),
        expect.any(String),
        0,
      );
    });
  });

  it('says why, where the server would not play it', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(refused('That file has no video in it.'));

    const drawn = await render(<Watching mediaId="one" onDone={jest.fn()} />);

    await waitFor(() => {
      expect(drawn.getByText('That file has no video in it.')).toBeTruthy();
    });
  });

  it('offers a way out of a refusal', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(refused('No.'));

    const onDone = jest.fn();
    const drawn = await render(<Watching mediaId="one" onDone={onDone} />);

    await waitFor(() => {
      expect(drawn.getByText('Back')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Back'));

    expect(onDone).toHaveBeenCalled();
  });

  it('lets go of the session on the way out', async () => {
    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'direct', url: '/api/playback/a-session/file' }));

    const drawn = await render(<Watching mediaId="one" onDone={jest.fn()} />);

    await waitFor(() => {
      expect(drawn.getByText('Done')).toBeTruthy();
    });

    await drawn.unmount();

    expect(stopPlaybackSession).toHaveBeenCalledWith('a-session', expect.any(String));
  });

  it('lets go of a session that arrived after they had already left', async () => {
    let answer = (outcome: StartOutcome) => {
      void outcome;
    };

    jest.mocked(startPlaybackSession).mockReturnValue(
      new Promise((settle) => {
        answer = settle;
      }),
    );

    const drawn = await render(<Watching mediaId="one" onDone={jest.fn()} />);

    await drawn.unmount();

    await act(() => {
      answer(started({ kind: 'direct', url: '/file' }));
    });

    expect(stopPlaybackSession).toHaveBeenCalledWith('a-session', expect.any(String));
  });

  it('says it is still watching, so the encoder is not collected mid-film', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'hls', manifestUrl: '/master.m3u8' }));

    const drawn = await render(<Watching mediaId="one" onDone={jest.fn()} />);

    await waitFor(() => {
      expect(drawn.getByText('Done')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(90_000);
    });

    expect(jest.mocked(heartbeatPlaybackSession).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('tells presence it has stopped, rather than leaving a viewer on the sessions page', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(<Watching mediaId="one" onDone={jest.fn()} />);

    await waitFor(() => {
      expect(drawn.getByText('Done')).toBeTruthy();
    });

    await drawn.unmount();

    expect(stopWatching).toHaveBeenCalled();
  });

  it('asks the server to begin where they left off', async () => {
    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'hls', manifestUrl: '/master.m3u8' }));

    await render(<Watching mediaId="a-film" startSeconds={1234.6} onDone={jest.fn()} />);

    await waitFor(() => {
      expect(startPlaybackSession).toHaveBeenCalledWith(
        'a-film',
        expect.anything(),
        expect.any(String),
        1234,
      );
    });
  });

  it('writes down where they got to, so the next phone knows', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'hls', manifestUrl: '/master.m3u8' }));

    const drawn = await render(<Watching mediaId="a-film" onDone={jest.fn()} />);

    await waitFor(() => {
      expect(drawn.getByText('Done')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(30_000);
    });

    expect(reportWatchProgress).toHaveBeenCalledWith(
      'a-film',
      { positionSeconds: 420, durationSeconds: 6960 },
      { isLeaving: false },
    );
  });

  it('says nothing about where they got to before anything has loaded', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'hls', manifestUrl: '/master.m3u8' }));

    theFakePlayer.duration = 0;

    const drawn = await render(<Watching mediaId="a-film" onDone={jest.fn()} />);

    await waitFor(() => {
      expect(drawn.getByText('Done')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(30_000);
    });

    expect(reportWatchProgress).not.toHaveBeenCalled();
  });

  it('writes it down on the way out, where the phone is being put away', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(<Watching mediaId="a-film" onDone={jest.fn()} />);

    await waitFor(() => {
      expect(drawn.getByText('Done')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    await drawn.unmount();

    expect(reportWatchProgress).toHaveBeenCalledWith(
      'a-film',
      { positionSeconds: 420, durationSeconds: 6960 },
      { isLeaving: true },
    );
  });

  it('winds a whole file on itself, since the server sent all of it', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(<Watching mediaId="a-film" startSeconds={600} onDone={jest.fn()} />);

    await waitFor(() => {
      expect(drawn.getByText('Done')).toBeTruthy();
    });

    expect(theFakePlayer.currentTime).toBe(600);
  });

  it('leaves a transcode alone, since the server already started it there', async () => {
    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'hls', manifestUrl: '/master.m3u8' }));

    const drawn = await render(<Watching mediaId="a-film" startSeconds={600} onDone={jest.fn()} />);

    await waitFor(() => {
      expect(drawn.getByText('Done')).toBeTruthy();
    });

    expect(theFakePlayer.currentTime).toBe(420);
  });

  it('says nothing on the way out about a film it never saw playing', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(<Watching mediaId="a-film" onDone={jest.fn()} />);

    await waitFor(() => {
      expect(drawn.getByText('Done')).toBeTruthy();
    });

    await drawn.unmount();

    expect(reportWatchProgress).not.toHaveBeenCalled();
  });
});
