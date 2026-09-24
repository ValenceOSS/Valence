import { render, userEvent, waitFor } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { fetchLibraries, fetchLibraryItems } from '@ValenceClient/library/fetchLibrary';
import { fetchWatchProgress } from '@ValenceClient/playback/watchProgress';
import { fetchComingUp, fetchShows } from '@ValenceClient/library/fetchShows';
import { fetchSession } from '@ValenceClient/session/auth';
import { TheLibrary } from './TheLibrary';
import type { TheLibraryProps } from './TheLibrary.types';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';

jest.mock('@ValenceClient/library/fetchLibrary');
jest.mock('@ValenceClient/library/fetchShows');
jest.mock('@ValenceClient/session/auth');
jest.mock('@ValenceMobile/components/ACarriedMark/ACarriedMark', () => ({
  ACarriedMark: () => null,
}));
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

const SEVERANCE = {
  id: 'severance',
  libraryId: 'one',
  title: 'Severance',
  seasonCount: 2,
  episodeCount: 19,
  latestAddedAt: '2026-01-01T00:00:00.000Z',
  coverMediaId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  seriesId: null,
  year: 2022,
};

const HALF_WAY_THROUGH_ARRIVAL = {
  mediaId: aTitle('Arrival').id,
  positionSeconds: 3480,
  durationSeconds: 6960,
  isFinished: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const theLibrary = (overrides: Partial<TheLibraryProps> = {}) =>
  render(
    <TheLibrary
      onWatch={jest.fn()}
      onLookAt={jest.fn()}
      onLookAtShow={jest.fn()}
      onScan={jest.fn()}
      onNotifications={jest.fn()}
      onAlbum={jest.fn()}
      onArtist={jest.fn()}
      onPlaylist={jest.fn()}
      onLiked={jest.fn()}
      onAllAlbums={jest.fn()}
      onAllArtists={jest.fn()}
      onBook={jest.fn()}
      onRead={jest.fn()}
      {...overrides}
    />,
    { wrapper: CacheScope },
  );

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  jest.mocked(fetchLibraries).mockReset();
  jest.mocked(fetchLibraryItems).mockReset();
  jest.mocked(fetchWatchProgress).mockReset().mockResolvedValue([]);
  jest.mocked(fetchShows).mockReset().mockResolvedValue([]);
  jest.mocked(fetchComingUp).mockReset().mockResolvedValue([]);
  jest.mocked(fetchSession).mockReset().mockResolvedValue({
    id: 'mark',
    name: 'Mark',
    email: 'mark@lumon.example',
    emailVerified: true,
  });
});

afterEach(() => {
  forgetPlatform();
});

describe('TheLibrary', () => {
  it('asks to scan a television in from the bar', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });
    const onScan = jest.fn();

    const drawn = await theLibrary({ onScan });

    await userEvent.press(drawn.getByRole('button', { name: 'Sign in a television' }));

    expect(onScan).toHaveBeenCalled();
  });

  it('opens on home, drawing what the libraries hold without asking which', async () => {
    jest
      .mocked(fetchLibraries)
      .mockResolvedValue([
        aLibrary('one', 'Films'),
        { ...aLibrary('two', 'Shows'), kind: 'shows' },
      ]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    const drawn = await theLibrary();

    await waitFor(() => {
      expect(drawn.getAllByLabelText('Arrival').length).toBeGreaterThan(0);
    });
    expect(fetchLibraryItems).toHaveBeenCalledWith('one', expect.anything());
  });

  it('draws the films of a household on their own part', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Films'));

    await waitFor(() => {
      expect(drawn.getAllByLabelText('Arrival').length).toBeGreaterThan(0);
    });
  });

  it('offers a choice of library only where a kind has more than one', async () => {
    jest
      .mocked(fetchLibraries)
      .mockResolvedValue([aLibrary('one', 'Films'), aLibrary('two', 'Classics')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Films'));
    await userEvent.press(await drawn.findByText('Classics'));

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenLastCalledWith('two', expect.anything());
    });
  });

  it('says a library is empty rather than showing nothing at all', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Films'));

    expect(await drawn.findByText('No films yet')).toBeTruthy();
    expect(drawn.getByText('Ask the server admin to scan it.')).toBeTruthy();
  });

  it('says so where the libraries could not be read', async () => {
    jest.mocked(fetchLibraries).mockRejectedValue(new Error('refused'));
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await theLibrary();

    expect(await drawn.findByText('Those could not be read.')).toBeTruthy();
  });

  it('tells whoever is listening which title somebody wants to see', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    const onLookAt = jest.fn();
    const drawn = await theLibrary({ onLookAt });

    await userEvent.press(await drawn.findByText('Films'));
    await userEvent.press(await drawn.findByLabelText('Arrival'));

    expect(onLookAt).toHaveBeenCalledWith(aTitle('Arrival').id);
  });

  it('shows how far through something a viewer already is', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });
    jest.mocked(fetchWatchProgress).mockResolvedValue([HALF_WAY_THROUGH_ARRIVAL]);

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Films'));

    await waitFor(() => {
      expect(
        drawn.getAllByRole('progressbar', { name: 'How far through Arrival', value: { now: 50 } }),
      ).not.toHaveLength(0);
    });
  });

  it('draws nothing across something nobody has started', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Films'));
    await drawn.findByLabelText('Arrival');

    expect(drawn.queryByRole('progressbar')).toBeNull();
  });

  it('opens on what somebody was part way through', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });
    jest.mocked(fetchWatchProgress).mockResolvedValue([HALF_WAY_THROUGH_ARRIVAL]);

    const drawn = await theLibrary();

    expect(await drawn.findByText('Continue watching')).toBeTruthy();
  });

  it('says nothing about carrying on to a household that has not started anything', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    const drawn = await theLibrary();

    await waitFor(() => {
      expect(drawn.getAllByLabelText('Arrival').length).toBeGreaterThan(0);
    });
    expect(drawn.queryByText('Continue watching')).toBeNull();
  });

  it('leaves out what they have finished', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });
    jest
      .mocked(fetchWatchProgress)
      .mockResolvedValue([
        { ...HALF_WAY_THROUGH_ARRIVAL, positionSeconds: 6960, isFinished: true },
      ]);

    const drawn = await theLibrary();

    await waitFor(() => {
      expect(drawn.getAllByLabelText('Arrival').length).toBeGreaterThan(0);
    });
    expect(drawn.queryByText('Continue watching')).toBeNull();
  });

  it('draws a programme once, rather than once for every episode of it', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([{ ...aLibrary('one', 'Shows'), kind: 'shows' }]);
    jest.mocked(fetchShows).mockResolvedValue([SEVERANCE]);

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Shows'));

    expect(await drawn.findByLabelText('Severance')).toBeTruthy();
    expect(fetchLibraryItems).not.toHaveBeenCalledWith(
      'one',
      expect.objectContaining({ kind: 'shows' }),
    );
  });

  it('opens the programme that was pressed', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([{ ...aLibrary('one', 'Shows'), kind: 'shows' }]);
    jest.mocked(fetchShows).mockResolvedValue([SEVERANCE]);

    const onLookAtShow = jest.fn();
    const drawn = await theLibrary({ onLookAtShow });

    await userEvent.press(await drawn.findByText('Shows'));
    await userEvent.press(await drawn.findByLabelText('Severance'));

    expect(onLookAtShow).toHaveBeenCalledWith('one', 'severance');
  });

  it('offers music and books where there are some', async () => {
    jest
      .mocked(fetchLibraries)
      .mockResolvedValue([
        aLibrary('one', 'Films'),
        { ...aLibrary('two', 'Albums'), kind: 'music' },
        { ...aLibrary('three', 'Books'), kind: 'books' },
      ]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await theLibrary();

    expect(await drawn.findByText('Music')).toBeTruthy();
    expect(drawn.getByText('Books')).toBeTruthy();
  });

  it('says there are no libraries on a server that has none, rather than a blank home', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([]);

    const drawn = await theLibrary();

    expect(await drawn.findByText('No libraries yet')).toBeTruthy();
    expect(drawn.getByText('Ask the server admin to add one.')).toBeTruthy();
  });

  it('says there is nothing to watch yet where the libraries hold nothing', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await theLibrary();

    expect(await drawn.findByText('Nothing to watch yet')).toBeTruthy();
  });
});
