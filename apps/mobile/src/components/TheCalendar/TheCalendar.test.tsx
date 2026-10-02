import { render, userEvent, waitFor } from '@testing-library/react-native';
import { addDays } from '@ValenceCore/functions/addDays';
import { localDayOf } from '@ValenceCore/functions/localDayOf';
import { monthGridOf } from '@ValenceCore/functions/monthGridOf';
import { fetchReleaseCalendar } from '@ValenceClient/calendar/fetchReleaseCalendar';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { nameTheMonth } from '@ValenceClient/calendar/nameTheMonth';
import { findAShow } from '@ValenceClient/library/findAShow';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { TheCalendar } from './TheCalendar';
import type { APage } from '@ValenceMobile/components/SignedIn/SignedIn.types';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

jest.mock('@ValenceClient/calendar/fetchReleaseCalendar');
jest.mock('@ValenceClient/library/findAShow');

const TODAY = localDayOf();

const AN_EPISODE = aCalendarEntry({ date: TODAY });

const A_FILM = aCalendarEntry({
  id: 'film:100:digital',
  date: TODAY,
  title: 'A Film',
  episode: null,
  release: 'digital',
  artworkMediaId: null,
  state: 'wanted',
  source: 'request',
  opens: { kind: 'asking', requestKind: 'film', catalogueId: '100' },
});

const drawCalendar = (onOpen: (page: APage) => void = jest.fn()) =>
  render(<TheCalendar onOpen={onOpen} onBack={jest.fn()} />, { wrapper: CacheScope });

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  jest.mocked(fetchReleaseCalendar).mockReset().mockResolvedValue([]);
  jest.mocked(findAShow).mockReset().mockResolvedValue(null);
});

afterEach(() => {
  forgetPlatform();
});

describe('TheCalendar', () => {
  it('reads the weeks of this month and lists what comes out today', async () => {
    jest.mocked(fetchReleaseCalendar).mockResolvedValue([AN_EPISODE, A_FILM]);
    const grid = monthGridOf(TODAY);

    const drawn = await drawCalendar();

    expect(await drawn.findByText('A Show')).toBeTruthy();
    expect(drawn.getByText('A Film')).toBeTruthy();
    expect(drawn.getByText(nameTheMonth(TODAY))).toBeTruthy();
    expect(fetchReleaseCalendar).toHaveBeenCalledWith(grid[0], grid[grid.length - 1], 'mine');
  });

  it('lists the day picked, and says so where nothing comes out on it', async () => {
    jest.mocked(fetchReleaseCalendar).mockResolvedValue([AN_EPISODE]);

    const drawn = await drawCalendar();

    await drawn.findByText('A Show');
    await userEvent.press(drawn.getByRole('button', { name: 'Tomorrow' }));

    expect(await drawn.findByText('No releases')).toBeTruthy();
    expect(drawn.queryByText('A Show')).toBeNull();
    expect(drawn.getByRole('button', { name: 'Tomorrow', selected: true })).toBeTruthy();

    await userEvent.press(drawn.getByText('Today'));

    expect(await drawn.findByText('A Show')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Today', selected: true })).toBeTruthy();
  });

  it('turns a month at a time, and back to today', async () => {
    const drawn = await drawCalendar();
    const next = `${addDays(`${TODAY.slice(0, 7)}-01`, 31).slice(0, 7)}-01`;
    const grid = monthGridOf(next);

    await userEvent.press(drawn.getByRole('button', { name: 'Next' }));

    expect(drawn.getByText(nameTheMonth(next))).toBeTruthy();
    await waitFor(() => {
      expect(fetchReleaseCalendar).toHaveBeenLastCalledWith(grid[0], grid[grid.length - 1], 'mine');
    });

    await userEvent.press(drawn.getByText('Today'));

    expect(drawn.getByText(nameTheMonth(TODAY))).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Today', selected: true })).toBeTruthy();
  });

  it('opens a sheet to go to any day from the month’s name', async () => {
    const drawn = await drawCalendar();

    expect(drawn.queryByText('Go to a day')).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Go to a day' }));

    expect(drawn.getByText('Go to a day')).toBeTruthy();
  });

  it('lists what comes out over the next two months, by day', async () => {
    const soon = addDays(TODAY, 3);
    const later = addDays(TODAY, 10);
    jest
      .mocked(fetchReleaseCalendar)
      .mockResolvedValue([
        aCalendarEntry({ id: 'later', date: later, title: 'Later Show' }),
        aCalendarEntry({ id: 'soon', date: soon, title: 'Sooner Show' }),
      ]);

    const drawn = await drawCalendar();

    await userEvent.press(drawn.getByRole('button', { name: 'Upcoming' }));

    expect(await drawn.findByText('Sooner Show')).toBeTruthy();
    expect(drawn.getByText('Later Show')).toBeTruthy();
    expect(drawn.getByText(nameTheDay(soon, TODAY))).toBeTruthy();
    expect(drawn.getByText(nameTheDay(later, TODAY))).toBeTruthy();
    expect(fetchReleaseCalendar).toHaveBeenLastCalledWith(TODAY, addDays(TODAY, 59), 'mine');
  });

  it('says so where nothing comes out over the next two months', async () => {
    const drawn = await drawCalendar();

    await userEvent.press(drawn.getByRole('button', { name: 'Upcoming' }));

    expect(await drawn.findByText('Nothing comes out on these days')).toBeTruthy();
  });

  it('says so where the calendar could not be read', async () => {
    jest.mocked(fetchReleaseCalendar).mockRejectedValue(new Error('refused'));

    const drawn = await drawCalendar();

    expect(await drawn.findByText('Those could not be read.')).toBeTruthy();
  });

  it.each<[string, CalendarEntry, APage]>([
    [
      'a title the library holds',
      aCalendarEntry({ date: TODAY, opens: { kind: 'item', mediaId: 'dune' } }),
      { kind: 'title', mediaId: 'dune' },
    ],
    ['a film only asked for', A_FILM, { kind: 'asking', about: 'film', id: '100' }],
  ])('opens the page of %s', async (_, entry, page) => {
    jest.mocked(fetchReleaseCalendar).mockResolvedValue([entry]);
    const onOpen = jest.fn();

    const drawn = await drawCalendar(onOpen);

    await userEvent.press(await drawn.findByText(entry.title));

    expect(onOpen).toHaveBeenCalledWith(page);
  });

  it('opens nothing for music or books asked for, which a phone does not ask for', async () => {
    jest.mocked(fetchReleaseCalendar).mockResolvedValue([
      {
        ...A_FILM,
        title: 'Blue',
        opens: { kind: 'asking', requestKind: 'album', catalogueId: 'blue' },
      },
    ]);
    const onOpen = jest.fn();

    const drawn = await drawCalendar(onOpen);

    await userEvent.press(await drawn.findByText('Blue'));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('opens a show in the library that holds it', async () => {
    jest.mocked(fetchReleaseCalendar).mockResolvedValue([AN_EPISODE]);
    jest.mocked(findAShow).mockResolvedValue({
      id: 'show-1',
      libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afb1',
      title: 'A Show',
      seasonCount: 2,
      episodeCount: 10,
      latestAddedAt: '2026-09-01T00:00:00.000Z',
      coverMediaId: '3fa85f64-5717-4562-b3fc-2c963f66afc1',
      seriesId: null,
    });
    const onOpen = jest.fn();

    const drawn = await drawCalendar(onOpen);

    await userEvent.press(await drawn.findByText('A Show'));

    await waitFor(() => {
      expect(onOpen).toHaveBeenCalledWith({
        kind: 'show',
        libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afb1',
        showId: 'show-1',
      });
    });
    expect(findAShow).toHaveBeenCalledWith(expect.anything(), 'series-1');
  });

  it('opens the series where no library holds the show', async () => {
    jest.mocked(fetchReleaseCalendar).mockResolvedValue([AN_EPISODE]);
    const onOpen = jest.fn();

    const drawn = await drawCalendar(onOpen);

    await userEvent.press(await drawn.findByText('A Show'));

    await waitFor(() => {
      expect(onOpen).toHaveBeenCalledWith({ kind: 'series', seriesId: 'series-1' });
    });
  });
});
