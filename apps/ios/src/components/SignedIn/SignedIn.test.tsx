import { render, userEvent, waitFor } from '@testing-library/react-native';
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
      expect(drawn.getByText('Library')).toBeTruthy();
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

    await waitFor(() => {
      expect(drawn.getByText('Sign out')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Sign out'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(onOut).toHaveBeenCalled();
    });
  });

  it('opens a title when somebody presses its poster', async () => {
    withOneTitle();

    const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Arrival')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Arrival'));

    await waitFor(() => {
      expect(drawn.getByText('Linguists meet a ship.')).toBeTruthy();
    });
  });

  it('plays the title they were looking at, not some other one', async () => {
    withOneTitle();

    const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Arrival')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Arrival'));

    await waitFor(() => {
      expect(drawn.getByText('Watch')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Watch'));

    await waitFor(() => {
      expect(startPlaybackSession).toHaveBeenCalledWith(
        ARRIVAL.id,
        expect.anything(),
        expect.any(String),
        0,
        undefined,
        undefined,
      );
    });
  });

  it('goes back to the library from a title', async () => {
    withOneTitle();

    const drawn = await render(around(<SignedIn onOut={jest.fn()} />));

    await waitFor(() => {
      expect(drawn.getByLabelText('Arrival')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Arrival'));

    await waitFor(() => {
      expect(drawn.getByText('Back')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Back'));

    await waitFor(() => {
      expect(drawn.getByText('Sign out')).toBeTruthy();
    });
  });
});
