import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, userEvent } from '@testing-library/react-native';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { summariseDetail } from '@ValenceClient/library/summariseDetail';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { playbackQueries } from '@ValenceClient/query/playbackQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { Player } from '@ValenceTv/screens/Player/Player';
import { aFakeVideoPlayer as mockAFakeVideoPlayer } from '@ValenceTv/testing/aFakeVideoPlayer';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';
import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { Session } from '@ValenceTv/playback/usePlaybackSession';

type Heard = (event: { eventType: string; eventKeyAction?: number }) => void;

type Asked = { startSeconds: number; audio: number | undefined; quality: string | undefined };

type Controlled = { onPause: () => void; onResume: () => void; onSeek: (seconds: number) => void };

const mockVideo = { current: mockAFakeVideoPlayer() };

const mockSession: { current: Session; asked: Asked[] } = {
  current: { kind: 'starting' },
  asked: [],
};

const mockMenu: { back: (() => void) | null } = { back: null };

const mockRing: { isListening: boolean; turn: (degrees: number) => void } = {
  isListening: false,
  turn: () => undefined,
};

const mockControlled: { current: Controlled | null } = { current: null };

const mockRemote = new Set<Heard>();

const mockReport = jest.fn<Promise<boolean>, [string, object]>(() => Promise.resolve(true));

jest.mock('expo-video', () => ({
  useVideoPlayer: () => mockVideo.current,
  VideoView: () => null,
}));

jest.mock('@ValenceTv/playback/usePlaybackSession', () => ({
  usePlaybackSession: (
    _mediaId: string,
    startSeconds: number,
    _isPlaying: () => boolean,
    audio: number | undefined,
    quality: string | undefined,
  ) => {
    mockSession.asked.push({ startSeconds, audio, quality });

    return mockSession.current;
  },
}));

jest.mock('@ValenceTv/playback/useRemoteControlled', () => ({
  useRemoteControlled: (controlled: Controlled) => {
    mockControlled.current = controlled;
  },
}));

jest.mock('@ValenceTv/navigation/useMenuButton', () => ({
  useMenuButton: (back: (() => void) | null) => {
    mockMenu.back = back;
  },
}));

jest.mock('@ValenceTv/remote/useRemoteRing', () => ({
  useRemoteRing: (isListening: boolean, onTurn: (degrees: number) => void) => {
    mockRing.isListening = isListening;
    mockRing.turn = onTurn;
  },
}));

jest.mock('@ValenceClient/playback/watchProgress', () => ({
  ...jest.requireActual<object>('@ValenceClient/playback/watchProgress'),
  reportWatchProgress: (mediaId: string, report: object) => mockReport(mediaId, report),
}));

jest.mock('react-native/Libraries/Components/TV/TVEventHandler', () => ({
  __esModule: true,
  default: {
    addListener: (heard: Heard) => {
      mockRemote.add(heard);

      return {
        remove: () => {
          mockRemote.delete(heard);
        },
      };
    },
  },
}));

const MEDIA_ID = '00000000-0000-4000-8000-000000000002';

const LIBRARY_ID = '00000000-0000-4000-8000-00000000f1f1';

const DETAIL = MediaDetailSchema.parse({
  id: MEDIA_ID,
  libraryId: LIBRARY_ID,
  title: 'Half Loop',
  year: 2022,
  container: 'mkv',
  durationSeconds: 3000,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  width: 1920,
  height: 1080,
  bitrateKbps: 8000,
  addedAt: '2026-01-01T00:00:00.000Z',
  metadata: {
    hasPoster: true,
    hasBackdrop: true,
    hasLogo: false,
    certification: '15',
    seriesTitle: 'Severance',
    seasonNumber: 1,
    episodeNumber: 2,
  },
  audioStreams: [
    { index: 1, codec: 'eac3', channels: 6, language: 'eng', isDefault: true, isAtmos: false },
    { index: 2, codec: 'aac', channels: 2, language: 'fra', isAtmos: false },
  ],
  subtitleStreams: [],
});

const FILM = MediaDetailSchema.parse({
  ...DETAIL,
  title: 'Arrival',
  metadata: { hasPoster: true, hasBackdrop: true, hasLogo: false },
});

const THIS_EPISODE = summariseDetail(DETAIL);

const NEXT_EPISODE: MediaSummary = {
  ...THIS_EPISODE,
  id: '00000000-0000-4000-8000-000000000003',
  title: 'In Perpetuity',
  episodeNumber: 3,
};

const SHOW: ShowDetail = {
  id: 'severance',
  libraryId: LIBRARY_ID,
  title: 'Severance',
  seasonCount: 1,
  episodeCount: 2,
  latestAddedAt: '2026-01-01T00:00:00.000Z',
  coverMediaId: MEDIA_ID,
  seriesId: null,
  seasons: [{ seasonNumber: 1, episodes: [THIS_EPISODE, NEXT_EPISODE] }],
};

const aTrackOfWords = (
  id: string,
  label: string,
  change: Partial<SubtitleTrack> = {},
): SubtitleTrack => ({
  id,
  language: 'en',
  label,
  format: 'srt',
  isForced: false,
  isHearingImpaired: false,
  delivery: 'text',
  streamIndex: null,
  ...change,
});

const aCue = (from: number, to: number, text: string): SubtitleCue => ({
  from,
  to,
  spans: [
    {
      text,
      fontFamily: null,
      fontHeight: null,
      colour: null,
      opacity: null,
      isBold: false,
      isItalic: false,
      isUnderlined: false,
      isStruckThrough: false,
    },
  ],
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
});

const STARTED: StartedSession = {
  sessionId: 'session-1',
  delivery: { kind: 'hls', manifestUrl: '/api/sessions/session-1/main.m3u8' },
  mode: 'direct',
  plan: {
    mediaId: MEDIA_ID,
    container: { kind: 'passthrough', reason: { code: 'ClientSupportsSource', detail: 'fine' } },
    video: { kind: 'passthrough', reason: { code: 'ClientSupportsSource', detail: 'fine' } },
    audio: {
      kind: 'passthrough',
      streamIndex: 1,
      reason: { code: 'ClientSupportsSource', detail: 'fine' },
    },
    subtitles: { kind: 'none', reason: { code: 'ClientSupportsSource', detail: 'none' } },
  },
  warnings: [],
  reuse: null,
};

const SOURCE = {
  uri: 'https://valence.example/api/sessions/session-1/main.m3u8',
  headers: { authorization: 'Bearer a-token' },
  contentType: 'hls',
} as const;

const READY: Session = { kind: 'ready', source: SOURCE, started: STARTED };

const aViewer = (askStillWatchingAfter: number): ViewerProfile => ({
  id: '00000000-0000-4000-8000-0000000000aa',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter,
  showsWhatIamWatching: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

type Setup = {
  detail?: typeof DETAIL;
  startSeconds?: number;
  carriedOn?: number;
  segments?: MediaSegment[];
  tracks?: SubtitleTrack[];
  cues?: Record<string, SubtitleCue[]>;
  show?: ShowDetail | null;
  viewer?: ViewerProfile;
};

const draw = async (setup: Setup = {}) => {
  const detail = setup.detail ?? DETAIL;
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  const onLeave = jest.fn();
  const onNext = jest.fn();

  cache.setQueryData(libraryQueries.detail(MEDIA_ID).queryKey, detail);
  cache.setQueryData(playbackQueries.segments(MEDIA_ID).queryKey, setup.segments ?? []);
  cache.setQueryData(playbackQueries.subtitleTracks(MEDIA_ID).queryKey, setup.tracks ?? []);
  cache.setQueryData(playbackQueries.trickplay(MEDIA_ID).queryKey, null);
  cache.setQueryData(
    libraryQueries.show(LIBRARY_ID, showIdOf(summariseDetail(detail))).queryKey,
    setup.show ?? null,
  );

  for (const [trackId, cues] of Object.entries(setup.cues ?? {})) {
    cache.setQueryData(playbackQueries.cues(MEDIA_ID, trackId).queryKey, cues);
  }

  if (setup.viewer !== undefined) {
    cache.setQueryData(profileQueries.watching().queryKey, setup.viewer);
  }

  const screen = (
    <QueryClientProvider client={cache}>
      <Player
        mediaId={MEDIA_ID}
        startSeconds={setup.startSeconds ?? 0}
        carriedOn={setup.carriedOn ?? 0}
        onLeave={onLeave}
        onNext={onNext}
      />
    </QueryClientProvider>
  );
  const drawn = await render(screen);

  return {
    drawn,
    onLeave,
    onNext,
    redraw: () => drawn.rerender(screen),
  };
};

const tell = (
  event: string,
  payload: Record<string, string | number | boolean | null | { message: string }>,
) =>
  act(() => {
    mockVideo.current.tell(event, payload);
  });

const press = (eventType: string, eventKeyAction?: number) =>
  act(() => {
    for (const heard of mockRemote) {
      heard(eventKeyAction === undefined ? { eventType } : { eventType, eventKeyAction });
    }
  });

const menu = () =>
  act(() => {
    mockMenu.back?.();
  });

const playingAt = async (position: number, duration = 3000) => {
  await tell('sourceLoad', { duration });
  await tell('timeUpdate', { currentTime: position });
  await tell('playingChange', { isPlaying: true });
};

describe('Player', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => new Promise<Response>(() => undefined));
    mockVideo.current = mockAFakeVideoPlayer();
    mockSession.current = READY;
    mockSession.asked = [];
    mockMenu.back = null;
    mockControlled.current = null;
    mockReport.mockClear();
  });

  describe('starting', () => {
    it('waits with the player held while the session starts', async () => {
      mockSession.current = { kind: 'starting' };

      const { drawn } = await draw();

      expect(drawn.container.queryAll((node) => node.type === 'ActivityIndicator')).toHaveLength(1);
      expect(mockVideo.current.pause).toHaveBeenCalled();
      expect(mockVideo.current.replaceAsync).not.toHaveBeenCalled();
    });

    it('opens what the server sent, named for the system, and plays it from where it was asked to start', async () => {
      await draw({ startSeconds: 120 });

      expect(mockVideo.current.replaceAsync).toHaveBeenCalledWith({
        ...SOURCE,
        metadata: { title: 'Severance', artist: 'S1: E2 · Half Loop' },
      });
      expect(mockVideo.current.currentTime).toBe(120);
      expect(mockVideo.current.play).toHaveBeenCalled();
    });

    it('names a film by its own title, with no episode beneath', async () => {
      await draw({ detail: FILM });

      expect(mockVideo.current.replaceAsync).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { title: 'Arrival' } }),
      );
    });

    it('asks for the session from where it was told to start, at the quality last chosen', async () => {
      platformInUse().store.write('valence.qualityPreference', '720p');

      await draw({ startSeconds: 45 });

      expect(mockSession.asked.at(-1)).toEqual({
        startSeconds: 45,
        audio: undefined,
        quality: '720p',
      });
    });
  });

  describe('when it cannot play', () => {
    it('says why the session failed, and goes back', async () => {
      mockSession.current = { kind: 'failed', reason: 'The file has gone.' };

      const { drawn, onLeave } = await draw();

      expect(drawn.getByText('The file has gone.')).toBeTruthy();

      await userEvent.press(drawn.getByRole('button', { name: 'Go back' }));

      expect(onLeave).toHaveBeenCalledTimes(1);
    });

    it('says what the player said went wrong once it has loaded', async () => {
      const { drawn } = await draw();

      await tell('statusChange', { status: 'error', error: { message: 'Bad stream' } });

      expect(drawn.getByText('This could not be played. (Bad stream)')).toBeTruthy();
    });

    it('says the sign-in may have run out when the server turned the television away', async () => {
      const { drawn } = await draw();

      await tell('statusChange', { status: 'error', error: { message: 'Error -1013 refused' } });

      expect(
        drawn.getByText(
          'This Valence turned the television away. Its sign-in may have run out, so go back and sign in again.',
        ),
      ).toBeTruthy();
    });

    it('says the player gave no reason when it gave none', async () => {
      const { drawn } = await draw();

      await tell('statusChange', { status: 'error', error: null });

      expect(drawn.getByText('This could not be played. (the player gave no reason)')).toBeTruthy();
    });

    it('pays no heed to an error while it is still switching streams', async () => {
      mockSession.current = { kind: 'starting' };

      const { drawn } = await draw();

      await tell('statusChange', { status: 'error', error: { message: 'Bad stream' } });

      expect(drawn.queryByText('This could not be played. (Bad stream)')).toBeNull();
    });
  });

  describe('the controls', () => {
    it('show what is playing, its year, its rating and the episode', async () => {
      const { drawn } = await draw();

      expect(drawn.getByText('Severance')).toBeTruthy();
      expect(drawn.getByText('2022')).toBeTruthy();
      expect(drawn.getByText('15')).toBeTruthy();
      expect(drawn.getByText('S1: E2 · Half Loop')).toBeTruthy();
    });

    it('pause while playing and play while paused', async () => {
      const { drawn } = await draw();

      await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

      expect(mockVideo.current.play).toHaveBeenCalledTimes(2);

      await tell('playingChange', { isPlaying: true });
      await userEvent.press(drawn.getByRole('button', { name: 'Pause' }));

      expect(mockVideo.current.pause).toHaveBeenCalledTimes(1);
    });

    it('go back and forward ten seconds, never before the start or past the end', async () => {
      const { drawn } = await draw();

      await tell('sourceLoad', { duration: 3000 });
      await tell('timeUpdate', { currentTime: 5 });

      const [back, forward] = drawn.getAllByRole('button', { name: '10s' });

      if (back === undefined || forward === undefined) {
        throw new Error('The skip buttons were not drawn.');
      }

      await userEvent.press(back);

      expect(mockVideo.current.currentTime).toBe(0);

      await tell('timeUpdate', { currentTime: 2995 });
      await userEvent.press(forward);

      expect(mockVideo.current.currentTime).toBe(3000);
    });

    it('move on to the next episode, with none having followed on untouched', async () => {
      const { drawn, onNext } = await draw({ show: SHOW, carriedOn: 3 });

      await userEvent.press(drawn.getByRole('button', { name: 'Next episode' }));

      expect(onNext).toHaveBeenCalledWith(NEXT_EPISODE, 0);
    });

    it('offer no next episode for a film', async () => {
      const { drawn } = await draw({ detail: FILM });

      expect(drawn.queryByRole('button', { name: 'Next episode' })).toBeNull();
    });

    describe('left alone', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('go away after a few seconds of playing, and come back at a press', async () => {
        const { drawn } = await draw();

        await playingAt(100);
        await act(() => {
          jest.advanceTimersByTime(4900);
        });

        expect(drawn.getByRole('button', { name: 'Pause' })).toBeTruthy();

        await act(() => {
          jest.advanceTimersByTime(200);
        });

        expect(drawn.queryByRole('button', { name: 'Pause' })).toBeNull();

        await press('down');

        expect(drawn.getByRole('button', { name: 'Pause' })).toBeTruthy();
      });

      it('stay up while paused', async () => {
        const { drawn } = await draw();

        await act(() => {
          jest.advanceTimersByTime(20_000);
        });

        expect(drawn.getByRole('button', { name: 'Play' })).toBeTruthy();
      });

      it('let left and right skip ten seconds while they are away, without bringing them back to do it', async () => {
        const { drawn } = await draw();

        await playingAt(100);
        await act(() => {
          jest.advanceTimersByTime(5000);
        });
        await press('left');

        expect(mockVideo.current.currentTime).toBe(90);

        await act(() => {
          jest.advanceTimersByTime(5000);
        });
        await press('right');

        expect(mockVideo.current.currentTime).toBe(110);
        expect(drawn.getByRole('button', { name: 'Pause' })).toBeTruthy();
      });
    });
  });

  describe('the remote', () => {
    it('pauses and plays with Play/Pause whatever is showing', async () => {
      await draw();

      await tell('playingChange', { isPlaying: true });
      await press('playPause');

      expect(mockVideo.current.pause).toHaveBeenCalledTimes(1);

      await tell('playingChange', { isPlaying: false });
      await press('playPause');

      expect(mockVideo.current.play).toHaveBeenCalledTimes(2);
    });

    it('leaves left and right to move between the controls while they are up', async () => {
      await draw();

      await playingAt(100);
      mockVideo.current.currentTime = 100;
      await press('right');

      expect(mockVideo.current.currentTime).toBe(100);
    });

    it('lets another device pause, play and move the player', async () => {
      await draw();

      mockControlled.current?.onPause();
      mockControlled.current?.onResume();
      mockControlled.current?.onSeek(321);

      expect(mockVideo.current.pause).toHaveBeenCalledTimes(1);
      expect(mockVideo.current.play).toHaveBeenCalledTimes(2);
      expect(mockVideo.current.currentTime).toBe(321);
    });
  });

  describe('Menu', () => {
    it('leaves while paused', async () => {
      const { onLeave } = await draw();

      await menu();

      expect(onLeave).toHaveBeenCalledTimes(1);
    });

    it('puts the controls away first while playing, then leaves', async () => {
      const { drawn, onLeave } = await draw();

      await playingAt(100);
      await menu();

      expect(onLeave).not.toHaveBeenCalled();
      expect(drawn.queryByRole('button', { name: 'Pause' })).toBeNull();

      await menu();

      expect(onLeave).toHaveBeenCalledTimes(1);
    });

    it('closes the settings, and steps back to them from a choice', async () => {
      const { drawn } = await draw();

      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));
      await userEvent.press(drawn.getByRole('button', { name: 'Speed, Normal' }));

      expect(drawn.getByRole('button', { name: '1.5×' })).toBeTruthy();

      await menu();

      expect(drawn.getByRole('button', { name: 'Speed, Normal' })).toBeTruthy();

      await menu();

      expect(drawn.queryByRole('button', { name: 'Speed, Normal' })).toBeNull();
      expect(drawn.getByRole('button', { name: 'Settings' })).toBeTruthy();
    });
  });

  describe('scrubbing', () => {
    it('moves a cursor with left and right while on the bar, and jumps there when pressed', async () => {
      const { drawn } = await draw();

      await playingAt(100);
      await fireEvent(drawn.getByRole('button', { name: 'Scrub' }), 'focus');
      await press('right');
      await press('right');

      expect(drawn.getAllByText('2:00')).toHaveLength(2);
      expect(mockVideo.current.currentTime).toBe(0);

      await press('left');

      expect(drawn.getAllByText('1:50')).toHaveLength(2);

      await userEvent.press(drawn.getByRole('button', { name: 'Scrub' }));

      expect(mockVideo.current.currentTime).toBe(110);
    });

    it('leaves playing where it was when the remote moves off the bar', async () => {
      const { drawn } = await draw();

      await playingAt(100);

      const bar = drawn.getByRole('button', { name: 'Scrub' });

      await fireEvent(bar, 'focus');
      await press('right');
      await fireEvent(bar, 'blur');

      expect(drawn.getAllByText('1:40')).toHaveLength(1);
      expect(mockVideo.current.currentTime).toBe(0);
      expect(mockRing.isListening).toBe(false);
    });

    it('keeps the cursor within the title', async () => {
      const { drawn } = await draw();

      await playingAt(4, 3000);
      await fireEvent(drawn.getByRole('button', { name: 'Scrub' }), 'focus');
      await press('left');

      expect(drawn.getAllByText('0:00')).toHaveLength(2);
    });

    it('moves the cursor as a thumb turns round the ring', async () => {
      const { drawn } = await draw();

      await playingAt(100);
      await fireEvent(drawn.getByRole('button', { name: 'Scrub' }), 'focus');

      expect(mockRing.isListening).toBe(true);

      await act(() => {
        mockRing.turn(180);
      });

      expect(drawn.getAllByText('2:10')).toHaveLength(2);
    });

    describe('with a direction held', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('runs the cursor on, faster the longer it is held, until it is let go', async () => {
        const { drawn } = await draw();

        await playingAt(100);
        await fireEvent(drawn.getByRole('button', { name: 'Scrub' }), 'focus');
        await press('longRight', 0);
        await act(() => {
          jest.advanceTimersByTime(300);
        });

        expect(drawn.getAllByText('2:31')).toHaveLength(2);

        await press('longRight', 1);
        await act(() => {
          jest.advanceTimersByTime(1000);
        });

        expect(drawn.getAllByText('2:31')).toHaveLength(2);
      });
    });
  });

  describe('the settings', () => {
    it('list each setting with what it is set to now', async () => {
      const { drawn } = await draw();

      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));

      expect(drawn.getByRole('button', { name: 'Quality, Original' })).toBeTruthy();
      expect(drawn.getByRole('button', { name: 'Audio, English · 5.1 · EAC3' })).toBeTruthy();
      expect(drawn.getByRole('button', { name: 'Subtitles, Off' })).toBeTruthy();
      expect(drawn.getByRole('button', { name: 'Speed, Normal' })).toBeTruthy();
      expect(drawn.getByRole('button', { name: 'Stats for nerds, Off' })).toBeTruthy();
    });

    it('change how fast it plays', async () => {
      const { drawn } = await draw();

      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));
      await userEvent.press(drawn.getByRole('button', { name: 'Speed, Normal' }));

      expect(drawn.getAllByRole('button')).toEqual(
        ['0.5×', '0.75×', 'Normal', '1.25×', '1.5×', '2×'].map((name) =>
          drawn.getByRole('button', { name }),
        ),
      );

      await userEvent.press(drawn.getByRole('button', { name: '1.5×' }));

      expect(mockVideo.current.playbackRate).toBe(1.5);

      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));

      expect(drawn.getByRole('button', { name: 'Speed, 1.5×' })).toBeTruthy();
    });

    it('offer only the qualities the file can give, and restart from where it was at the one chosen', async () => {
      const { drawn } = await draw();

      await tell('timeUpdate', { currentTime: 250 });
      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));
      await userEvent.press(drawn.getByRole('button', { name: 'Quality, Original' }));

      expect(drawn.queryByRole('button', { name: '4K' })).toBeNull();
      expect(drawn.queryByRole('button', { name: '1440p' })).toBeNull();
      expect(drawn.getByRole('button', { name: '1080p' })).toBeTruthy();

      await userEvent.press(drawn.getByRole('button', { name: '720p' }));

      expect(platformInUse().store.read('valence.qualityPreference')).toBe('720p');
      expect(mockSession.asked.at(-1)).toEqual({
        startSeconds: 250,
        audio: undefined,
        quality: '720p',
      });

      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));

      expect(drawn.getByRole('button', { name: 'Quality, 720p' })).toBeTruthy();
    });

    it('leave the session be when the quality in use is chosen again', async () => {
      const { drawn } = await draw();

      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));
      await userEvent.press(drawn.getByRole('button', { name: 'Quality, Original' }));

      const asked = mockSession.asked.length;

      await userEvent.press(drawn.getByRole('button', { name: 'Original' }));

      expect(mockSession.asked.slice(asked).every((one) => one.quality === 'original')).toBe(true);
      expect(platformInUse().store.read('valence.qualityPreference')).toBeNull();
    });

    it('start a new session from where it was for another sound track', async () => {
      const { drawn } = await draw();

      await tell('timeUpdate', { currentTime: 80 });
      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));
      await userEvent.press(drawn.getByRole('button', { name: 'Audio, English · 5.1 · EAC3' }));
      await userEvent.press(drawn.getByRole('button', { name: 'Français · Stereo · AAC' }));

      expect(mockSession.asked.at(-1)).toEqual({ startSeconds: 80, audio: 2, quality: 'original' });

      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));

      expect(drawn.getByRole('button', { name: 'Audio, Français · Stereo · AAC' })).toBeTruthy();
    });

    it('show the subtitles chosen, and only those sent as text', async () => {
      const { drawn } = await draw({
        tracks: [
          aTrackOfWords('en', 'English'),
          aTrackOfWords('burnt', 'Signs', { delivery: 'burnIn' }),
        ],
        cues: { en: [aCue(20, 25, 'Please enjoy each fact equally.')] },
      });

      await tell('timeUpdate', { currentTime: 22 });
      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));
      await userEvent.press(drawn.getByRole('button', { name: 'Subtitles, Off' }));

      expect(drawn.queryByRole('button', { name: 'Signs' })).toBeNull();

      await userEvent.press(drawn.getByRole('button', { name: 'English' }));

      expect(drawn.getByText('Please enjoy each fact equally.')).toBeTruthy();
    });

    it('start on forced subtitles in the language being spoken', async () => {
      const { drawn } = await draw({
        tracks: [aTrackOfWords('forced', 'English (forced)', { isForced: true, language: 'eng' })],
        cues: { forced: [aCue(0, 10, 'Lumon')] },
      });

      expect(drawn.getByText('Lumon')).toBeTruthy();
    });

    it('show the stats for nerds over the picture and put them away again', async () => {
      const { drawn } = await draw();

      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));
      await userEvent.press(drawn.getByRole('button', { name: 'Stats for nerds, Off' }));

      expect(drawn.getByText('Stats for nerds')).toBeTruthy();
      expect(drawn.getByText('session-1')).toBeTruthy();

      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));
      await userEvent.press(drawn.getByRole('button', { name: 'Stats for nerds, On' }));

      expect(drawn.queryByText('session-1')).toBeNull();
    });
  });

  describe('skipping', () => {
    it('offers to skip the intro while it plays, and skips to its end', async () => {
      const { drawn } = await draw({
        segments: [{ kind: 'intro', startSeconds: 10, endSeconds: 70, source: 'manual' }],
      });

      expect(drawn.queryByRole('button', { name: 'Skip Intro' })).toBeNull();

      await tell('timeUpdate', { currentTime: 15 });
      await userEvent.press(drawn.getByRole('button', { name: 'Skip Intro' }));

      expect(mockVideo.current.currentTime).toBe(70);
    });

    it('hides the offer while the settings are open', async () => {
      const { drawn } = await draw({
        segments: [{ kind: 'recap', startSeconds: 0, endSeconds: 60, source: 'manual' }],
      });

      await tell('timeUpdate', { currentTime: 5 });

      expect(drawn.getByRole('button', { name: 'Skip Recap' })).toBeTruthy();

      await userEvent.press(drawn.getByRole('button', { name: 'Settings' }));

      expect(drawn.queryByRole('button', { name: 'Skip Recap' })).toBeNull();
    });
  });

  describe('what comes next', () => {
    it('offers the next episode as the credits roll', async () => {
      const { drawn } = await draw({
        show: SHOW,
        segments: [{ kind: 'credits', startSeconds: 2800, endSeconds: 3000, source: 'manual' }],
      });

      await tell('sourceLoad', { duration: 3000 });
      await tell('timeUpdate', { currentTime: 2700 });

      expect(drawn.queryByText('S1: E3 · In Perpetuity')).toBeNull();

      await tell('timeUpdate', { currentTime: 2850 });

      expect(drawn.getByText('Up next')).toBeTruthy();
      expect(drawn.getByText('S1: E3 · In Perpetuity')).toBeTruthy();
      expect(drawn.queryByRole('button', { name: 'Skip Credits' })).toBeNull();
    });

    it('offers it in the last half minute of an episode whose credits are not marked', async () => {
      const { drawn } = await draw({ show: SHOW });

      await tell('sourceLoad', { duration: 3000 });
      await tell('timeUpdate', { currentTime: 2975 });

      expect(drawn.getByText('S1: E3 · In Perpetuity')).toBeTruthy();
    });

    it('plays it on its own at the end, counting one more followed on', async () => {
      const { onNext } = await draw({ show: SHOW, carriedOn: 1 });

      await tell('playToEnd', {});

      expect(onNext).toHaveBeenCalledWith(NEXT_EPISODE, 2);
    });

    it('starts the count of episodes followed on untouched again when Play is pressed', async () => {
      const { drawn, onNext } = await draw({ show: SHOW, carriedOn: 1 });

      await tell('sourceLoad', { duration: 3000 });
      await tell('timeUpdate', { currentTime: 2990 });
      await userEvent.press(drawn.getByRole('button', { name: /^Play in/ }));

      expect(onNext).toHaveBeenCalledWith(NEXT_EPISODE, 0);
    });

    it('stays with the credits when asked while they are still rolling', async () => {
      const { drawn, onLeave } = await draw({ show: SHOW });

      await tell('sourceLoad', { duration: 3000 });
      await tell('timeUpdate', { currentTime: 2990 });
      await userEvent.press(drawn.getByRole('button', { name: 'Stay' }));

      expect(drawn.queryByText('S1: E3 · In Perpetuity')).toBeNull();
      expect(onLeave).not.toHaveBeenCalled();
    });

    it('asks whether anybody is still there once enough have followed on untouched, and waits', async () => {
      const { drawn, onNext } = await draw({ show: SHOW, carriedOn: 2, viewer: aViewer(2) });

      await tell('playToEnd', {});

      expect(drawn.getByText('Are you still watching?')).toBeTruthy();
      expect(onNext).not.toHaveBeenCalled();

      await userEvent.press(drawn.getByRole('button', { name: 'Keep watching' }));

      expect(onNext).toHaveBeenCalledWith(NEXT_EPISODE, 0);
    });

    it('leaves once the credits have ended and somebody chose to stay', async () => {
      const { drawn, onLeave } = await draw({ show: SHOW, carriedOn: 2, viewer: aViewer(2) });

      await tell('playToEnd', {});
      await userEvent.press(drawn.getByRole('button', { name: 'Stay' }));

      expect(onLeave).toHaveBeenCalledTimes(1);
    });

    it('leaves at the end of a film', async () => {
      const { onLeave } = await draw({ detail: FILM });

      await tell('playToEnd', {});

      expect(onLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('reporting where the viewer is', () => {
    it('says where they stopped as the screen closes', async () => {
      const { drawn } = await draw();

      await tell('sourceLoad', { duration: 3000 });
      await tell('timeUpdate', { currentTime: 100 });
      await drawn.unmount();

      expect(mockReport).toHaveBeenCalledWith(MEDIA_ID, {
        positionSeconds: 100,
        durationSeconds: 3000,
        isFinished: false,
      });
    });

    it('counts it finished once the credits are all that is left', async () => {
      const { drawn } = await draw();

      await tell('sourceLoad', { duration: 3000 });
      await tell('timeUpdate', { currentTime: 2995 });
      await drawn.unmount();

      expect(mockReport).toHaveBeenCalledWith(
        MEDIA_ID,
        expect.objectContaining({ positionSeconds: 2995, isFinished: true }),
      );
    });

    it('says nothing before anything has played', async () => {
      const { drawn } = await draw();

      await drawn.unmount();

      expect(mockReport).not.toHaveBeenCalled();
    });
  });
});
