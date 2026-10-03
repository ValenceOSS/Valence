import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { act, fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchMediaDetail } from '@ValenceClient/library/fetchLibrary';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { fetchSegments } from '@ValenceClient/playback/fetchSegments';
import {
  heartbeatPlaybackSession,
  startPlaybackSession,
  stopPlaybackSession,
  stopWatching,
} from '@ValenceClient/playback/startPlaybackSession';
import { reportWatchProgress } from '@ValenceClient/playback/watchProgress';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import { theFakePlayer } from '@ValenceMobile/testing/theFakePlayer';
import { holdAWindowOf } from '@ValenceMobile/testing/holdAWindowOf';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aFakeHeldFiles } from '@ValenceClient/testing/aFakeHeldFiles';
import { rememberWatchedOffline, watchedOffline } from '@ValenceClient/offline/watchedOffline';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';
import { aWatchPartyStateWith } from '@ValenceClient/testing/aWatchPartyStateWith';
import { Watching } from './Watching';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { StartedSession, StartOutcome } from '@ValenceClient/playback/startPlaybackSession';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/playback/startPlaybackSession');
jest.mock('@ValenceClient/library/fetchLibrary');
jest.mock('@ValenceClient/playback/fetchSegments', () => ({
  ...jest.requireActual<object>('@ValenceClient/playback/fetchSegments'),
  fetchSegments: jest.fn(),
}));

jest.mock('@ValenceClient/playback/watchProgress', () => ({
  REPORT_EVERY_MILLISECONDS: 10_000,
  reportWatchProgress: jest.fn(),
}));

const reason = {
  code: 'ClientSupportsSource',
  detail: sayVerbatim('Client declares support'),
} as const;

const A_PLAN: PlaybackPlan = {
  mediaId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  container: { kind: 'passthrough', reason },
  video: { kind: 'passthrough', reason },
  audio: { kind: 'passthrough', streamIndex: 1, reason },
  subtitles: { kind: 'none', reason },
};

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

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
  holdAWindowOf(393, 852);
  jest.mocked(startPlaybackSession).mockReset();
  jest.mocked(stopPlaybackSession).mockReset().mockResolvedValue();
  jest.mocked(stopWatching).mockReset().mockResolvedValue();
  jest.mocked(heartbeatPlaybackSession).mockReset().mockResolvedValue();
  jest.mocked(reportWatchProgress).mockReset().mockResolvedValue();
  jest.mocked(theCookiesThisPhoneHolds).mockReset().mockResolvedValue(null);
  jest.mocked(lockAsync).mockReset().mockResolvedValue();
  jest
    .mocked(fetchMediaDetail)
    .mockReset()
    .mockReturnValue(new Promise(() => undefined));
  theFakePlayer.currentTime = 420;
  theFakePlayer.duration = 6960;
});

afterEach(() => {
  jest.useRealTimers();
});

const KEPT: HeldFile = {
  downloadId: '00000000-0000-4000-8000-000000000001',
  mediaId: '00000000-0000-4000-8000-000000000002',
  seriesId: null,
  seriesTitle: 'Ted',
  title: 'My Two Dads',
  quality: '480p',
  durationSeconds: 1500,
  ofBytes: null,
  state: 'here',
  bytes: 250_000_000,
  bytesPerSecond: null,
  failure: null,
  keptAt: '2026-09-29T00:00:00.000Z',
  hasPoster: true,
  hasTrickplay: true,
};

/**
 * A phone holding downloads, whose kept thumbnails are read by the given function.
 *
 * @param trickplayFor - How the kept thumbnails are read.
 */
const aPhoneKeeping = (trickplayFor = jest.fn(() => Promise.resolve(null))) => {
  installPlatform(
    aFakePlatform({ canKeepFiles: () => true, held: { ...aFakeHeldFiles().held, trickplayFor } }),
  );

  return trickplayFor;
};

describe('Watching', () => {
  it('waits without words, since there is nothing to say yet', async () => {
    jest.mocked(startPlaybackSession).mockReturnValue(new Promise(() => undefined));

    const drawn = await render(around(<Watching mediaId="one" onDone={jest.fn()} />));

    expect(drawn.queryByLabelText('Stop watching')).toBeNull();
    expect(drawn.queryByText(/asking/iu)).toBeNull();
  });

  it('leaves a player alone until it has something to play, since Android takes that as the end', async () => {
    const expoVideo = jest.requireMock<{
      useVideoPlayer: (
        source: { uri: string } | null,
        ready?: (player: typeof theFakePlayer) => void,
      ) => typeof theFakePlayer;
    }>('expo-video');
    const asMocked = expoVideo.useVideoPlayer;
    const play = jest.spyOn(theFakePlayer, 'play');

    expoVideo.useVideoPlayer = (source, ready) => {
      if (source === null) {
        ready?.(theFakePlayer);
      }

      return asMocked(source, ready);
    };
    jest.mocked(startPlaybackSession).mockReturnValue(new Promise(() => undefined));

    await render(around(<Watching mediaId="one" onDone={jest.fn()} />));

    expect(play).not.toHaveBeenCalled();

    expoVideo.useVideoPlayer = asMocked;
    play.mockRestore();
  });

  it('tells the server what this phone can decode', async () => {
    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(
        started({ kind: 'hls', manifestUrl: '/api/playback/a-session/master.m3u8' }),
      );

    await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(startPlaybackSession).toHaveBeenCalledWith(
        'a-film',
        expect.objectContaining({ schemaVersion: 1 }),
        expect.any(String),
        0,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  it('says why, where the server would not play it', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(refused('That file has no video in it.'));

    const drawn = await render(around(<Watching mediaId="one" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByText('That file has no video in it.')).toBeTruthy();
    });
  });

  it('offers a way out of a refusal', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(refused('No.'));

    const onDone = jest.fn();
    const drawn = await render(around(<Watching mediaId="one" onDone={onDone} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Back')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Back'));

    expect(onDone).toHaveBeenCalled();
  });

  it('lets go of the session on the way out', async () => {
    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'direct', url: '/api/playback/a-session/file' }));

    const drawn = await render(around(<Watching mediaId="one" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
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

    const drawn = await render(around(<Watching mediaId="one" onDone={jest.fn()} />));

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

    const drawn = await render(around(<Watching mediaId="one" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(90_000);
    });

    expect(jest.mocked(heartbeatPlaybackSession).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('tells presence it has stopped, rather than leaving a viewer on the sessions page', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="one" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await drawn.unmount();

    expect(stopWatching).toHaveBeenCalled();
  });

  it('asks the server to begin where they left off', async () => {
    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'hls', manifestUrl: '/master.m3u8' }));

    await render(around(<Watching mediaId="a-film" startSeconds={1234.6} onDone={jest.fn()} />));

    await waitFor(() => {
      expect(startPlaybackSession).toHaveBeenCalledWith(
        'a-film',
        expect.anything(),
        expect.any(String),
        1234,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  it('writes down where they got to, so the next phone knows', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'hls', manifestUrl: '/master.m3u8' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(30_000);
    });

    expect(reportWatchProgress).toHaveBeenCalledWith(
      'a-film',
      { positionSeconds: 420, durationSeconds: 6960, isFinished: false },
      { isLeaving: false },
    );
  });

  it('says nothing about where they got to before anything has loaded', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'hls', manifestUrl: '/master.m3u8' }));

    theFakePlayer.duration = 0;

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(30_000);
    });

    expect(reportWatchProgress).not.toHaveBeenCalled();
  });

  it('writes it down on the way out, where the phone is being put away', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    await drawn.unmount();

    expect(reportWatchProgress).toHaveBeenCalledWith(
      'a-film',
      { positionSeconds: 420, durationSeconds: 6960, isFinished: false },
      { isLeaving: true },
    );
  });

  it('winds a whole file on itself, since the server sent all of it', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(
      around(<Watching mediaId="a-film" startSeconds={600} onDone={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    expect(theFakePlayer.currentTime).toBe(600);
  });

  it('seeks a transcode to where they left it too, since its playlist lays out the whole film', async () => {
    jest
      .mocked(startPlaybackSession)
      .mockResolvedValue(started({ kind: 'hls', manifestUrl: '/master.m3u8' }));

    const drawn = await render(
      around(<Watching mediaId="a-film" startSeconds={600} onDone={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    expect(theFakePlayer.currentTime).toBe(600);
  });

  it('says nothing on the way out about a film it never saw playing', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await drawn.unmount();

    expect(reportWatchProgress).not.toHaveBeenCalled();
  });

  it('hands the player this phone\u2019s session, which it would not ask for itself', async () => {
    jest.mocked(theCookiesThisPhoneHolds).mockResolvedValue('valence.session_token=abc');
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    expect(theFakePlayer.sentWith).toEqual({ Cookie: 'valence.session_token=abc' });
  });

  it('asks anyway where this phone holds nothing to send', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    expect(theFakePlayer.sentWith).toBeNull();
  });

  it('turns the phone sideways, since that is the shape of what is playing', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    expect(lockAsync).toHaveBeenCalledWith(OrientationLock.LANDSCAPE);
  });

  it('puts the phone back upright on the way out', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await drawn.unmount();

    expect(lockAsync).toHaveBeenLastCalledWith(OrientationLock.PORTRAIT_UP);
  });

  it('stops watching when they say so', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const onDone = jest.fn();
    const drawn = await render(around(<Watching mediaId="a-film" onDone={onDone} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Stop watching'));

    expect(onDone).toHaveBeenCalled();
  });

  it('stops the picture when they ask it to', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Pause')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Pause'));

    expect(theFakePlayer.playing).toBe(false);
  });

  it('offers to start it again once it is stopped', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Pause')).toBeTruthy();
    });

    await act(() => {
      theFakePlayer.playing = false;
      theFakePlayer.say('playingChange', { isPlaying: false });
    });

    expect(drawn.getByLabelText('Play')).toBeTruthy();
  });

  it('goes back ten seconds when asked', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    theFakePlayer.currentTime = 100;

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Back 10 seconds')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Back 10 seconds'));

    expect(theFakePlayer.currentTime).toBe(90);
  });

  it('goes forward ten seconds when asked', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    theFakePlayer.currentTime = 100;

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Forward 10 seconds')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Forward 10 seconds'));

    expect(theFakePlayer.currentTime).toBe(110);
  });

  it('asks the room to pause rather than pausing, while it is part of a watch party', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    theFakePlayer.currentTime = 100;
    const watchParty = aWatchPartyStateWith(jest.fn, { party: aWatchParty({ mediaId: 'a-film' }) });

    const drawn = await render(
      around(<Watching mediaId="a-film" onDone={jest.fn()} watchParty={watchParty} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Forward 10 seconds')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Forward 10 seconds'));

    expect(watchParty.send).toHaveBeenCalledWith({ kind: 'seek', atSeconds: 110 });
    expect(theFakePlayer.currentTime).toBe(100);

    await userEvent.press(drawn.getByLabelText(/^(Play|Pause)$/u));

    expect(watchParty.send).toHaveBeenCalledWith({ kind: 'pause', atSeconds: 100 });
  });

  it('opens the watch party from the controls, to start one around what is playing', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const watchParty = aWatchPartyStateWith(jest.fn);
    const drawn = await render(
      around(<Watching mediaId="a-film" onDone={jest.fn()} watchParty={watchParty} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Watch party')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Watch party'));
    await userEvent.press(drawn.getByLabelText('Start a watch party'));

    expect(watchParty.open).toHaveBeenCalledWith('a-film', 'watch');
  });

  it('offers no watch party for a copy kept on the phone', async () => {
    aPhoneKeeping();

    const drawn = await render(
      around(
        <Watching
          mediaId={KEPT.mediaId}
          kept={KEPT}
          onDone={jest.fn()}
          watchParty={aWatchPartyStateWith(jest.fn)}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Forward 10 seconds')).toBeTruthy();
    });

    expect(drawn.queryByLabelText('Watch party')).toBeNull();
  });

  it('gets out of the way while a film is playing', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(5000);
    });

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(drawn.queryByLabelText('Stop watching')).toBeNull();
  });

  it('stays where it is while a film is stopped, since they are looking at it', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      theFakePlayer.playing = false;
      theFakePlayer.say('playingChange', { isPlaying: false });
    });

    await act(() => {
      jest.advanceTimersByTime(20_000);
    });

    expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
  });

  it('comes back when the picture is touched', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(5000);
    });

    await fireEvent.press(drawn.getByLabelText('Show the controls'));

    expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
  });

  it('names an episode by its programme and place in it, dated by when it was shown', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(
      MediaDetailSchema.parse({
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        title: 'Felina',
        year: 2008,
        container: 'mkv',
        durationSeconds: 3300,
        videoCodec: 'hevc',
        videoRange: 'SDR',
        width: 1920,
        height: 1080,
        bitrateKbps: 8000,
        audioStreams: [
          {
            index: 1,
            codec: 'eac3',
            channels: 6,
            language: 'eng',
            isDefault: true,
            isAtmos: false,
          },
        ],
        subtitleStreams: [],
        addedAt: '2026-01-01T00:00:00.000Z',
        metadata: {
          overview: 'The end.',
          hasPoster: true,
          hasBackdrop: false,
          hasLogo: false,
          seriesTitle: 'Breaking Bad',
          seasonNumber: 5,
          episodeNumber: 16,
          releaseDate: '2013-09-29',
        },
      }),
    );
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="an-episode" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByText('Breaking Bad · S5E16 · Felina')).toBeTruthy();
    });

    expect(drawn.getByText('2013')).toBeTruthy();
  });

  it('tells the phone to keep showing what is playing on the lock screen', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    expect(theFakePlayer.showNowPlayingNotification).toBe(true);
    expect(theFakePlayer.describedAs?.artwork).toContain('/api/media/a-film/image/poster');
  });

  it('carries the film on in a floating picture when somebody leaves the app', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    expect(theFakePlayer.floatsOnLeaving).toBe(true);
    expect(theFakePlayer.staysActiveInBackground).toBe(true);
  });

  it('is still drawn while it is fading, so it does not vanish mid-fade', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
  });

  it('offers to skip an intro while it is playing', async () => {
    jest
      .mocked(fetchSegments)
      .mockResolvedValue([
        { kind: 'intro', startSeconds: 400, endSeconds: 500, source: 'manual' as const },
      ]);
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    theFakePlayer.currentTime = 405;

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Skip Intro')).toBeTruthy();
    });
  });

  it('offers nothing where a film has nothing marked', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    expect(drawn.queryByLabelText('Skip Intro')).toBeNull();
  });

  it('offers nothing long after the thing it would skip', async () => {
    jest
      .mocked(fetchSegments)
      .mockResolvedValue([
        { kind: 'intro', startSeconds: 400, endSeconds: 500, source: 'manual' as const },
      ]);
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    theFakePlayer.currentTime = 480;

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    expect(drawn.queryByLabelText('Skip Intro')).toBeNull();
  });

  it('goes to the end of what it skipped, not a fixed distance', async () => {
    jest
      .mocked(fetchSegments)
      .mockResolvedValue([
        { kind: 'credits', startSeconds: 400, endSeconds: 500, source: 'manual' as const },
      ]);
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    theFakePlayer.currentTime = 405;

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Skip Credits')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Skip Credits'));

    expect(theFakePlayer.currentTime).toBe(500);
  });

  it('writes a film down as finished once it is into its credits', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    theFakePlayer.currentTime = 6900;

    const drawn = await render(around(<Watching mediaId="a-film" onDone={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      jest.advanceTimersByTime(11_000);
    });

    expect(reportWatchProgress).toHaveBeenCalledWith(
      'a-film',
      { positionSeconds: 6900, durationSeconds: 6960, isFinished: true },
      { isLeaving: false },
    );
  });

  it('takes no end from a player that has nothing in it yet, which Android reports as one', async () => {
    jest.mocked(startPlaybackSession).mockReturnValue(new Promise(() => undefined));

    const onEnded = jest.fn();

    await render(around(<Watching mediaId="a-film" onDone={jest.fn()} onEnded={onEnded} />));

    await act(() => {
      theFakePlayer.say('playToEnd', { isPlaying: false });
    });

    expect(onEnded).not.toHaveBeenCalled();
  });

  it('takes no end from a film that has not yet said how long it is', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));
    theFakePlayer.duration = 0;

    const onEnded = jest.fn();
    const drawn = await render(
      around(<Watching mediaId="a-film" onDone={jest.fn()} onEnded={onEnded} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      theFakePlayer.say('playToEnd', { isPlaying: false });
    });

    expect(onEnded).not.toHaveBeenCalled();
  });

  it('says when the film has played to its end, so what follows can be decided', async () => {
    jest.mocked(startPlaybackSession).mockResolvedValue(started({ kind: 'direct', url: '/file' }));

    const onEnded = jest.fn();
    const drawn = await render(
      around(<Watching mediaId="a-film" onDone={jest.fn()} onEnded={onEnded} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
    });

    await act(() => {
      theFakePlayer.say('playToEnd', { isPlaying: false });
    });

    expect(onEnded).toHaveBeenCalled();
  });

  describe('a copy kept on this phone', () => {
    it('plays the file on the phone, without asking the server for a session', async () => {
      aPhoneKeeping();

      const drawn = await render(
        around(<Watching mediaId={KEPT.mediaId} kept={KEPT} onDone={jest.fn()} />),
      );

      await waitFor(() => {
        expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
      });

      expect(theFakePlayer.source).toBe(`/held/${KEPT.downloadId}`);
      expect(startPlaybackSession).not.toHaveBeenCalled();
    });

    it('is named from what was kept, since the server may not be there to ask', async () => {
      aPhoneKeeping();
      jest.mocked(fetchSegments).mockClear();

      const drawn = await render(
        around(<Watching mediaId={KEPT.mediaId} kept={KEPT} onDone={jest.fn()} />),
      );

      expect(await drawn.findByText(/My Two Dads/u)).toBeTruthy();
      expect(fetchMediaDetail).not.toHaveBeenCalled();
      expect(fetchSegments).not.toHaveBeenCalled();
    });

    it('scrubs with the thumbnails kept beside it', async () => {
      const trickplayFor = aPhoneKeeping();

      await render(around(<Watching mediaId={KEPT.mediaId} kept={KEPT} onDone={jest.fn()} />));

      await waitFor(() => {
        expect(trickplayFor).toHaveBeenCalledWith(KEPT.downloadId);
      });
    });

    it('picks up where it was left on this phone', async () => {
      aPhoneKeeping();
      rememberWatchedOffline(KEPT.mediaId, 600, 1500);

      const drawn = await render(
        around(<Watching mediaId={KEPT.mediaId} kept={KEPT} onDone={jest.fn()} />),
      );

      await waitFor(() => {
        expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
      });

      expect(theFakePlayer.currentTime).toBe(600);
    });

    it('remembers where it got to on the phone, and tells the server nothing', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
      aPhoneKeeping();

      const drawn = await render(
        around(<Watching mediaId={KEPT.mediaId} kept={KEPT} onDone={jest.fn()} />),
      );

      await waitFor(() => {
        expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
      });

      await act(() => {
        jest.advanceTimersByTime(30_000);
      });

      await drawn.unmount();

      expect(watchedOffline()).toEqual([
        expect.objectContaining({ mediaId: KEPT.mediaId, positionSeconds: 420 }),
      ]);
      expect(reportWatchProgress).not.toHaveBeenCalled();
      expect(heartbeatPlaybackSession).not.toHaveBeenCalled();
      expect(stopWatching).not.toHaveBeenCalled();
      expect(stopPlaybackSession).not.toHaveBeenCalled();
    });
  });
});
