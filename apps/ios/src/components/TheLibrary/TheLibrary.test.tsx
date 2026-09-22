import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { fetchLibraries, fetchLibraryItems } from '@ValenceClient/library/fetchLibrary';
import { fetchWatchProgress } from '@ValenceClient/playback/watchProgress';
import { fetchShows } from '@ValenceClient/library/fetchShows';
import { TheLibrary } from './TheLibrary';
import type { ReactNode } from 'react';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';

jest.mock('@ValenceClient/library/fetchLibrary');
jest.mock('@ValenceClient/library/fetchShows');
jest.mock('@ValenceClient/playback/watchProgress', () => ({
  ...jest.requireActual<object>('@ValenceClient/playback/watchProgress'),
  fetchWatchProgress: jest.fn(),
}));

const aLibrary = (id: string, name: string): Library => ({
  id,
  name,
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

const aTitle = (title: string): MediaSummary => ({
  id: `3fa85f64-5717-4562-b3fc-2c963f66af${title.length.toString().padStart(2, '0')}`,
  libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  title,
  year: 2016,
  durationSeconds: 6960,
  width: 3840,
  height: 2160,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
});

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  jest.mocked(fetchLibraries).mockReset();
  jest.mocked(fetchLibraryItems).mockReset();
  jest.mocked(fetchWatchProgress).mockReset().mockResolvedValue([]);
  jest.mocked(fetchShows).mockReset().mockResolvedValue([]);
});

afterEach(() => {
  forgetPlatform();
});

describe('TheLibrary', () => {
  it('shows the first library without asking somebody to choose one', async () => {
    jest
      .mocked(fetchLibraries)
      .mockResolvedValue([aLibrary('one', 'Films'), aLibrary('two', 'Shows')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith('one', expect.anything());
    });
  });

  it('draws what is in it', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getAllByText('Arrival').length).toBeGreaterThan(0);
    });
  });

  it('shows another library when it is picked', async () => {
    jest
      .mocked(fetchLibraries)
      .mockResolvedValue([aLibrary('one', 'Films'), aLibrary('two', 'Shows')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Shows')).toBeTruthy();
    });

    await userEvent.press(drawn.getByText('Shows'));

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith('two', expect.anything());
    });
  });

  it('says a library is empty rather than showing nothing at all', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Nothing in here yet.')).toBeTruthy();
    });
  });

  it('says so where the libraries could not be read', async () => {
    jest.mocked(fetchLibraries).mockRejectedValue(new Error('refused'));
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Those could not be read.')).toBeTruthy();
    });
  });

  it('tells whoever is listening which title somebody wants to see', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    const onLookAt = jest.fn();
    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={onLookAt} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Arrival')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Arrival'));

    expect(onLookAt).toHaveBeenCalledWith(aTitle('Arrival').id);
  });

  it('shows how far through something a viewer already is', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });
    jest.mocked(fetchWatchProgress).mockResolvedValue([
      {
        mediaId: aTitle('Arrival').id,
        positionSeconds: 3480,
        durationSeconds: 6960,
        isFinished: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(
        drawn.getAllByRole('progressbar', { name: 'How far through Arrival', value: { now: 50 } }),
      ).not.toHaveLength(0);
    });
  });

  it('draws nothing across something nobody has started', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Arrival')).toBeTruthy();
    });

    expect(drawn.queryByRole('progressbar')).toBeNull();
  });

  it('opens on what somebody was part way through', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });
    jest.mocked(fetchWatchProgress).mockResolvedValue([
      {
        mediaId: aTitle('Arrival').id,
        positionSeconds: 3480,
        durationSeconds: 6960,
        isFinished: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Continue watching')).toBeTruthy();
    });
  });

  it('says nothing about carrying on to a household that has not started anything', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Arrival')).toBeTruthy();
    });

    expect(drawn.queryByText('Continue watching')).toBeNull();
  });

  it('leaves out what they have finished', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });
    jest.mocked(fetchWatchProgress).mockResolvedValue([
      {
        mediaId: aTitle('Arrival').id,
        positionSeconds: 6960,
        durationSeconds: 6960,
        isFinished: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Arrival')).toBeTruthy();
    });

    expect(drawn.queryByText('Continue watching')).toBeNull();
  });

  it('draws a programme once, rather than once for every episode of it', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([{ ...aLibrary('one', 'Shows'), kind: 'shows' }]);
    jest.mocked(fetchShows).mockResolvedValue([
      {
        id: 'severance',
        libraryId: 'one',
        title: 'Severance',
        seasonCount: 2,
        episodeCount: 19,
        latestAddedAt: '2026-01-01T00:00:00.000Z',
        coverMediaId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        seriesId: null,
        year: 2022,
      },
    ]);

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getAllByText('Severance')).not.toHaveLength(0);
    });

    expect(fetchLibraryItems).not.toHaveBeenCalled();
  });

  it('opens the programme that was pressed', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([{ ...aLibrary('one', 'Shows'), kind: 'shows' }]);
    jest.mocked(fetchShows).mockResolvedValue([
      {
        id: 'severance',
        libraryId: 'one',
        title: 'Severance',
        seasonCount: 2,
        episodeCount: 19,
        latestAddedAt: '2026-01-01T00:00:00.000Z',
        coverMediaId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        seriesId: null,
        year: 2022,
      },
    ]);

    const onLookAtShow = jest.fn();
    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={onLookAtShow} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Severance')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Severance'));

    expect(onLookAtShow).toHaveBeenCalledWith('one', 'severance');
  });

  it('offers only what a phone can play, rather than albums that open in a film player', async () => {
    jest
      .mocked(fetchLibraries)
      .mockResolvedValue([
        aLibrary('one', 'Films'),
        { ...aLibrary('two', 'Music'), kind: 'music' },
        { ...aLibrary('three', 'Books'), kind: 'books' },
      ]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByText('Films')).toBeTruthy();
    });

    expect(drawn.queryByText('Music')).toBeNull();
    expect(drawn.queryByText('Books')).toBeNull();
  });

  it('shows what was searched for in place of the shelf', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest
      .mocked(fetchLibraryItems)
      .mockImplementation((_library, options) =>
        Promise.resolve(
          options?.search === 'Arrival'
            ? { items: [aTitle('Arrival')], total: 1 }
            : { items: [aTitle('Heat')], total: 1 },
        ),
      );

    const drawn = await render(
      around(<TheLibrary onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Heat')).toBeTruthy();
    });

    await userEvent.type(drawn.getByLabelText('Search'), 'Arrival');

    await waitFor(() => {
      expect(drawn.getByLabelText('Arrival')).toBeTruthy();
    });

    expect(drawn.queryByLabelText('Heat')).toBeNull();
  });
});
