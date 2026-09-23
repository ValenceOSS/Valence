import { act, render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { fetchSession, signOut } from '@ValenceClient/session/auth';
import {
  fetchLibraries,
  fetchLibraryItems,
  fetchMediaDetail,
} from '@ValenceClient/library/fetchLibrary';
import { startPlaybackSession } from '@ValenceClient/playback/startPlaybackSession';
import { fetchShow, fetchShows } from '@ValenceClient/library/fetchShows';
import { fetchProfiles } from '@ValenceClient/profiles/fetchProfiles';
import { ShowDetailSchema } from '@ValenceContracts/schemas/Show';
import { PROFILE_COLOURS, ViewerProfileSchema } from '@ValenceContracts/schemas/ViewerProfile';
import { theFakePlayer } from '@ValencePhone/testing/theFakePlayer';
import {
  LibrarySchema,
  MediaDetailSchema,
  MediaSummarySchema,
} from '@ValenceContracts/schemas/Library';
import { SignedIn } from './SignedIn';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/session/auth');
jest.mock('@ValenceClient/library/fetchLibrary');
jest.mock('@ValenceClient/playback/startPlaybackSession');
jest.mock('@ValenceClient/library/fetchShows');
jest.mock('@ValenceClient/profiles/fetchProfiles');

const A_SESSION = {
  id: 'MllMpJgdqC9rKsdlZjN23KwuRYubAfQF',
  name: 'Dan',
  email: 'dan@getvalence.app',
  emailVerified: true,
};

const A_LIBRARY = LibrarySchema.parse({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  name: 'Films',
  kind: 'movies',
  path: '/media/films',
  itemCount: 1,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
});

const ARRIVAL = MediaSummarySchema.parse({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  libraryId: A_LIBRARY.id,
  title: 'Arrival',
  year: 2016,
  durationSeconds: 6960,
  addedAt: '2026-01-01T00:00:00.000Z',
  width: 3840,
  height: 2160,
  videoCodec: 'hevc',
  videoRange: 'SDR',
});

const ARRIVAL_IN_FULL = MediaDetailSchema.parse({
  ...ARRIVAL,
  container: 'mkv',
  bitrateKbps: 12000,
  audioStreams: [
    { index: 1, codec: 'eac3', channels: 6, language: 'eng', isDefault: true, isAtmos: false },
  ],
  subtitleStreams: [],
  metadata: {
    overview: 'Linguists meet a ship.',
    hasPoster: false,
    hasBackdrop: false,
    hasLogo: false,
  },
});

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  jest.mocked(signOut).mockReset().mockResolvedValue(true);
  jest.mocked(fetchSession).mockReset().mockResolvedValue(A_SESSION);
  jest.mocked(fetchLibraries).mockReset().mockResolvedValue([]);
  jest.mocked(fetchLibraryItems).mockReset().mockResolvedValue({ items: [], total: 0 });
  jest.mocked(fetchMediaDetail).mockReset();
  jest
    .mocked(startPlaybackSession)
    .mockReset()
    .mockReturnValue(new Promise(() => undefined));
});

const withOneTitle = () => {
  jest.mocked(fetchLibraries).mockResolvedValue([A_LIBRARY]);
  jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [ARRIVAL], total: 1 });
  jest.mocked(fetchMediaDetail).mockResolvedValue(ARRIVAL_IN_FULL);
};

afterEach(() => {
  forgetPlatform();
});

describe('SignedIn', () => {
  it('shows the library once there is a session to read it with', async () => {
    const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('What to show')).toBeTruthy();
    });
  });

  it('asks nothing of the library before the session has answered', async () => {
    jest.mocked(fetchSession).mockReturnValue(new Promise(() => undefined));

    await render(around(<SignedIn onOut={jest.fn()} />));

    expect(fetchLibraries).not.toHaveBeenCalled();
  });

  it('signs out and says so', async () => {
    const onOut = jest.fn();
    const drawn = await render(around(<SignedIn onOut={onOut} />));

    await userEvent.press(await drawn.findByText('Account'));
    await userEvent.press(await drawn.findByText('Sign out'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(onOut).toHaveBeenCalled();
    });
  });

  it('opens a title when somebody presses its poster', async () => {
    withOneTitle();

    const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

    await userEvent.press(await drawn.findByText('Films'));
    await userEvent.press(await drawn.findByLabelText('Arrival'));

    await waitFor(() => {
      expect(drawn.getByText('Linguists meet a ship.')).toBeTruthy();
    });
  });

  it('plays the title they were looking at, not some other one', async () => {
    withOneTitle();

    const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

    await userEvent.press(await drawn.findByText('Films'));
    await userEvent.press(await drawn.findByLabelText('Arrival'));

    await userEvent.press(await drawn.findByText('Play'));

    await waitFor(() => {
      expect(startPlaybackSession).toHaveBeenCalledWith(
        ARRIVAL.id,
        expect.anything(),
        expect.any(String),
        0,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  it('goes back to the library from a title', async () => {
    withOneTitle();

    const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

    await userEvent.press(await drawn.findByText('Films'));
    await userEvent.press(await drawn.findByLabelText('Arrival'));

    await userEvent.press(await drawn.findByLabelText('Back'));

    expect(await drawn.findByLabelText('What to show')).toBeTruthy();
  });

  describe('when an episode plays to its end', () => {
    const SHOWS = { ...A_LIBRARY, kind: 'shows' as const };

    const anEpisode = (n: number) =>
      MediaSummarySchema.parse({
        id: `3fa85f64-5717-4562-b3fc-2c963f66af0${n.toString()}`,
        libraryId: A_LIBRARY.id,
        title: `Episode ${n.toString()}`,
        year: null,
        durationSeconds: 2640,
        width: 1920,
        height: 1080,
        videoCodec: 'hevc',
        videoRange: 'SDR',
        addedAt: '2026-01-01T00:00:00.000Z',
        seriesTitle: 'Severance',
        seasonNumber: 1,
        episodeNumber: n,
      });

    const THREE = [anEpisode(1), anEpisode(2), anEpisode(3)];

    const asksAfter = (askStillWatchingAfter: number) => {
      jest.mocked(fetchProfiles).mockResolvedValue([
        ViewerProfileSchema.parse({
          id: '3fa85f64-5717-4562-b3fc-2c963f66afb1',
          name: 'Dan',
          colour: PROFILE_COLOURS[0],
          avatar: { kind: 'initial' },
          askStillWatchingAfter,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      ]);
    };

    const intoTheFirstEpisode = async () => {
      jest.mocked(fetchLibraries).mockResolvedValue([SHOWS]);
      jest.mocked(fetchShows).mockResolvedValue([
        {
          id: 'severance',
          libraryId: A_LIBRARY.id,
          title: 'Severance',
          seasonCount: 1,
          episodeCount: 3,
          latestAddedAt: '2026-01-01T00:00:00.000Z',
          coverMediaId: THREE[0]!.id,
          seriesId: null,
        },
      ]);
      jest.mocked(fetchShow).mockResolvedValue(
        ShowDetailSchema.parse({
          id: 'severance',
          libraryId: A_LIBRARY.id,
          title: 'Severance',
          seasonCount: 1,
          episodeCount: 3,
          latestAddedAt: '2026-01-01T00:00:00.000Z',
          coverMediaId: THREE[0]!.id,
          seasons: [{ seasonNumber: 1, episodes: THREE }],
        }),
      );
      jest.mocked(fetchMediaDetail).mockImplementation((mediaId) =>
        Promise.resolve(
          MediaDetailSchema.parse({
            ...(THREE.find((episode) => episode.id === mediaId) ?? THREE[0]),
            container: 'mkv',
            bitrateKbps: 6000,
            audioStreams: ARRIVAL_IN_FULL.audioStreams,
            subtitleStreams: [],
            metadata: {
              overview: '',
              hasPoster: false,
              hasBackdrop: false,
              hasLogo: false,
              seriesTitle: 'Severance',
            },
          }),
        ),
      );
      jest.mocked(startPlaybackSession).mockResolvedValue({
        kind: 'started',
        session: {
          sessionId: 'a-session',
          delivery: { kind: 'direct', url: '/file' },
          mode: 'Direct play',
          plan: {
            mediaId: THREE[0]!.id,
            container: {
              kind: 'passthrough',
              reason: { code: 'ClientSupportsSource', detail: '' },
            },
            video: { kind: 'passthrough', reason: { code: 'ClientSupportsSource', detail: '' } },
            audio: {
              kind: 'passthrough',
              streamIndex: 1,
              reason: { code: 'ClientSupportsSource', detail: '' },
            },
            subtitles: { kind: 'none', reason: { code: 'ClientSupportsSource', detail: '' } },
          },
          warnings: [],
          reuse: null,
        },
      });

      const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

      await userEvent.press(await drawn.findByText('Shows'));
      await userEvent.press(await drawn.findByLabelText('Severance'));
      await waitFor(() => {
        expect(drawn.getByLabelText(/^(Play|Resume) Episode 1/)).toBeTruthy();
      });
      await userEvent.press(drawn.getByLabelText(/^(Play|Resume) Episode 1/));
      await waitFor(() => {
        expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
      });

      return drawn;
    };

    const itEnds = async () => {
      await act(() => {
        theFakePlayer.say('playToEnd', { isPlaying: false });
      });
    };

    it('plays the next one in the season', async () => {
      asksAfter(0);

      await intoTheFirstEpisode();
      await itEnds();

      await waitFor(() => {
        expect(jest.mocked(startPlaybackSession).mock.calls.at(-1)?.[0]).toBe(THREE[1]!.id);
      });
    });

    it('asks first once as many have followed as the profile allows', async () => {
      asksAfter(1);

      const drawn = await intoTheFirstEpisode();

      await itEnds();
      await waitFor(() => {
        expect(jest.mocked(startPlaybackSession).mock.calls.at(-1)?.[0]).toBe(THREE[1]!.id);
      });
      await waitFor(() => {
        expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
      });
      await itEnds();

      await waitFor(() => {
        expect(drawn.getByText('Are you still watching?')).toBeTruthy();
      });
    });

    it('asks instead of playing, not over the top of something already started', async () => {
      asksAfter(1);

      const drawn = await intoTheFirstEpisode();

      await itEnds();
      await waitFor(() => {
        expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
      });

      const startedBefore = jest.mocked(startPlaybackSession).mock.calls.length;

      await itEnds();
      await waitFor(() => {
        expect(drawn.getByText('Are you still watching?')).toBeTruthy();
      });

      expect(jest.mocked(startPlaybackSession).mock.calls.length).toBe(startedBefore);
    });

    it('carries on when they say they are still there', async () => {
      asksAfter(1);

      const drawn = await intoTheFirstEpisode();

      await itEnds();
      await waitFor(() => {
        expect(drawn.getByLabelText('Stop watching')).toBeTruthy();
      });
      await itEnds();
      await waitFor(() => {
        expect(drawn.getByText('Still watching')).toBeTruthy();
      });

      await userEvent.press(drawn.getByText('Still watching'));

      await waitFor(() => {
        expect(jest.mocked(startPlaybackSession).mock.calls.at(-1)?.[0]).toBe(THREE[2]!.id);
      });
    });
  });
});
