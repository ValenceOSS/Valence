import { render, userEvent, waitFor } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { fetchLibraries, fetchLibraryItems } from '@ValenceClient/library/fetchLibrary';
import { fetchWatchProgress } from '@ValenceClient/playback/watchProgress';
import { fetchComingUp, fetchShows } from '@ValenceClient/library/fetchShows';
import {
  readBrowseArrangement,
  saveBrowseArrangement,
} from '@ValenceClient/library/browseArrangementPreference';
import { fetchSession } from '@ValenceClient/session/auth';
import { useTheSideStrip } from '@ValenceMobile/hooks/useTheSideStrip';
import { chooseFromTheMenu } from '@ValenceMobile/testing/chooseFromTheMenu';
import { theMenuChoices } from '@ValenceMobile/testing/theMenuChoices';
import { TheLibrary } from './TheLibrary';
import type { TheLibraryProps } from './TheLibrary.types';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';

jest.mock('@ValenceClient/library/fetchLibrary');
jest.mock('@ValenceClient/library/fetchShows');
jest.mock('@ValenceClient/session/auth');
jest.mock('@ValenceMobile/components/ACarriedMark/ACarriedMark', () => ({
  ACarriedMark: () => null,
}));
jest.mock('@ValenceMobile/hooks/useTheSideStrip', () => ({ useTheSideStrip: jest.fn() }));
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

const SHOWS_LIBRARY = '3fa85f64-5717-4562-b3fc-2c963f66afb1';

const LONG_RUNNING_ID = '3fa85f64-5717-4562-b3fc-2c963f66afc1';

const anEpisode = (over: Partial<MediaSummary>): MediaSummary => ({
  ...aTitle('Pilot'),
  libraryId: SHOWS_LIBRARY,
  seasonNumber: 1,
  episodeNumber: 1,
  ...over,
});

const LONG_RUNNING = [
  anEpisode({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afd1',
    seriesId: LONG_RUNNING_ID,
    seriesTitle: 'Long Running',
    addedAt: '2025-01-01T00:00:00.000Z',
  }),
  anEpisode({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afd2',
    title: 'Return',
    seriesId: LONG_RUNNING_ID,
    seriesTitle: 'Long Running',
    seasonNumber: 2,
    addedAt: '2026-06-01T00:00:00.000Z',
  }),
];

const ALREADY_OVER = anEpisode({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afd3',
  title: 'Beginnings',
  seriesId: '3fa85f64-5717-4562-b3fc-2c963f66afc2',
  seriesTitle: 'Already Over',
  addedAt: '2026-03-01T00:00:00.000Z',
});

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
      onCollection={jest.fn()}
      onLiked={jest.fn()}
      onMix={jest.fn()}
      onAllAlbums={jest.fn()}
      onAllArtists={jest.fn()}
      onBook={jest.fn()}
      onRead={jest.fn()}
      onListen={jest.fn()}
      {...overrides}
    />,
    { wrapper: CacheScope },
  );

const postersOf = (
  drawn: Awaited<ReturnType<typeof theLibrary>>,
  names: readonly string[],
): string[] => {
  const every = drawn.getAllByRole('button');

  return [...names].sort(
    (left, right) =>
      every.indexOf(drawn.getByLabelText(left)) - every.indexOf(drawn.getByLabelText(right)),
  );
};

beforeEach(() => {
  jest.mocked(useTheSideStrip).mockReset().mockReturnValue(null);
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

    await userEvent.press(drawn.getByRole('button', { name: 'Sign in to a TV' }));

    expect(onScan).toHaveBeenCalled();
  });

  it('opens the release calendar from the bar where it is offered', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });
    const onCalendar = jest.fn();

    const drawn = await theLibrary({ onCalendar });

    await userEvent.press(drawn.getByRole('button', { name: 'Calendar' }));

    expect(onCalendar).toHaveBeenCalledTimes(1);
  });

  it('leaves the release calendar out of the bar where it is not offered', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await theLibrary();

    expect(drawn.getByRole('button', { name: 'Sign in to a TV' })).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Calendar' })).toBeNull();
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
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Films'));
    await waitFor(() => {
      expect(theMenuChoices('Which library')).toContain('Classics');
    });
    await chooseFromTheMenu('Which library', 'two');

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenLastCalledWith('two', expect.anything());
    });
  });

  it('offers no section for a library with nothing in it yet', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await theLibrary();

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalled();
    });

    expect(drawn.queryByText('Films')).toBeNull();
  });

  it('says so where the libraries could not be read', async () => {
    jest.mocked(fetchLibraries).mockRejectedValue(new Error('refused'));
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await theLibrary();

    expect(await drawn.findByText('Couldn’t load these.')).toBeTruthy();
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
        drawn.getAllByRole('progressbar', { name: 'Progress for Arrival', value: { now: 50 } }),
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
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: LONG_RUNNING, total: 2 });

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Shows'));

    expect(await drawn.findAllByLabelText('Long Running')).toHaveLength(1);
  });

  it('opens the programme that was pressed', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([{ ...aLibrary('one', 'Shows'), kind: 'shows' }]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: LONG_RUNNING, total: 2 });

    const onLookAtShow = jest.fn();
    const drawn = await theLibrary({ onLookAtShow });

    await userEvent.press(await drawn.findByText('Shows'));
    await userEvent.press(await drawn.findByLabelText('Long Running'));

    expect(onLookAtShow).toHaveBeenCalledWith(SHOWS_LIBRARY, LONG_RUNNING_ID);
  });

  it('puts a programme first when a new episode of it arrives', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([{ ...aLibrary('one', 'Shows'), kind: 'shows' }]);
    jest
      .mocked(fetchLibraryItems)
      .mockResolvedValue({ items: [...LONG_RUNNING, ALREADY_OVER], total: 3 });

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Shows'));

    await drawn.findByLabelText('Already Over');

    expect(postersOf(drawn, ['Already Over', 'Long Running'])).toEqual([
      'Long Running',
      'Already Over',
    ]);
  });

  it('orders a page as chosen, and remembers it for that page on this phone', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([{ ...aLibrary('one', 'Shows'), kind: 'shows' }]);
    jest
      .mocked(fetchLibraryItems)
      .mockResolvedValue({ items: [...LONG_RUNNING, ALREADY_OVER], total: 3 });

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Shows'));
    await userEvent.press(await drawn.findByRole('button', { name: 'Order, Recently added' }));
    await chooseFromTheMenu('Order', 'title');

    await waitFor(() => {
      expect(postersOf(drawn, ['Long Running', 'Already Over'])).toEqual([
        'Already Over',
        'Long Running',
      ]);
    });
    expect(readBrowseArrangement('shows')).toEqual({ order: 'title', isHidingWatched: false });
    expect(readBrowseArrangement('films')).toEqual({ order: 'added', isHidingWatched: false });
  });

  it('says so when leaving out what has been watched leaves nothing', async () => {
    saveBrowseArrangement('films', { order: 'added', isHidingWatched: true });
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [aTitle('Arrival')], total: 1 });
    jest
      .mocked(fetchWatchProgress)
      .mockResolvedValue([
        { ...HALF_WAY_THROUGH_ARRIVAL, positionSeconds: 6960, isFinished: true },
      ]);

    const drawn = await theLibrary();

    await userEvent.press(await drawn.findByText('Films'));

    expect(await drawn.findByText('You’ve watched everything here.')).toBeTruthy();
    expect(drawn.queryByText('No films yet')).toBeNull();
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

  it('keeps the bar clear of the strip down the side of a folding phone', async () => {
    jest.mocked(fetchLibraries).mockResolvedValue([aLibrary('one', 'Films')]);
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });
    jest
      .mocked(useTheSideStrip)
      .mockReturnValue({ side: 'right', breadth: 84, freeFrom: 176, centreIn: 42 });

    const drawn = await theLibrary();

    await drawn.findByText('Nothing to watch yet');
    const bar = drawn.getByRole('button', { name: 'Sign in to a TV' }).parent?.parent?.parent
      ?.parent;

    expect(bar).toHaveStyle({ paddingLeft: 0, paddingRight: 84 });
  });
});
