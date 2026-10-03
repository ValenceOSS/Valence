import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { addDays } from '@ValenceCore/functions/addDays';
import { localDayOf } from '@ValenceCore/functions/localDayOf';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { calendarQueries } from '@ValenceClient/query/calendarQueries';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { CalendarPage } from '@ValenceTv/screens/CalendarPage/CalendarPage';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

const TODAY = localDayOf();

const SOON = addDays(TODAY, 3);

const LATER = addDays(TODAY, 10);

const aCacheHolding = (entries: CalendarEntry[] | null): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  if (entries !== null) {
    cache.setQueryData(
      calendarQueries.releases(TODAY, addDays(TODAY, 59), 'mine').queryKey,
      entries,
    );
  }

  return cache;
};

const drawCalendar = (
  entries: CalendarEntry[] | null,
  told: { onOpen?: (entry: CalendarEntry) => void; onLight?: (path: string | null) => void } = {},
) =>
  render(
    <QueryClientProvider client={aCacheHolding(entries)}>
      <CalendarPage onOpen={told.onOpen ?? jest.fn()} onLight={told.onLight ?? jest.fn()} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CalendarPage', () => {
  it('shows nothing coming while the calendar is still being read', async () => {
    const onLight = jest.fn();
    const drawn = await drawCalendar(null, { onLight });

    expect(drawn.getByText('Calendar')).toBeTruthy();
    expect(drawn.queryByText('No releases on these dates')).toBeNull();
    expect(drawn.queryByRole('button')).toBeNull();
    expect(onLight).toHaveBeenCalledWith(null);
  });

  it('says so when nothing comes out over the next two months', async () => {
    const drawn = await drawCalendar([]);

    expect(drawn.getByText('No releases on these dates')).toBeTruthy();
    expect(
      drawn.getByText(
        'Episodes of shows in your library, and films and shows you’ve requested, appear here once they have a release date.',
      ),
    ).toBeTruthy();
  });

  it('heads each day with anything on it, the days in order', async () => {
    const drawn = await drawCalendar([
      aCalendarEntry({ id: 'later', date: LATER, title: 'Later Show' }),
      aCalendarEntry({ id: 'soon', date: SOON, title: 'Sooner Show' }),
      aCalendarEntry({ id: 'also', date: SOON, title: 'Also Show' }),
    ]);

    const rows = drawn.getAllByRole('button');

    expect(drawn.getByText(nameTheDay(SOON, TODAY))).toBeTruthy();
    expect(drawn.getByText(nameTheDay(LATER, TODAY))).toBeTruthy();
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveAccessibleName(/^Sooner Show/);
    expect(rows[1]).toHaveAccessibleName(/^Also Show/);
    expect(rows[2]).toHaveAccessibleName(/^Later Show/);
  });

  it('lights the page with the backdrop of the first thing coming', async () => {
    const onLight = jest.fn();
    await drawCalendar(
      [
        aCalendarEntry({ id: 'later', date: LATER, artworkMediaId: 'later-media' }),
        aCalendarEntry({ id: 'soon', date: SOON, artworkMediaId: 'soon-media' }),
      ],
      { onLight },
    );

    expect(onLight).toHaveBeenLastCalledWith('/api/media/soon-media/image/backdrop');
  });

  it('lights the page with the catalogue’s poster where the library holds none', async () => {
    const onLight = jest.fn();
    await drawCalendar(
      [aCalendarEntry({ date: SOON, artworkMediaId: null, posterUrl: '/posters/dune.jpg' })],
      { onLight },
    );

    expect(onLight).toHaveBeenLastCalledWith('/posters/dune.jpg');
  });

  it('opens the entry chosen', async () => {
    const onOpen = jest.fn();
    const entry = aCalendarEntry({ date: SOON });
    const drawn = await drawCalendar([entry], { onOpen });

    await userEvent.press(drawn.getByRole('button', { name: /^A Show/ }));

    expect(onOpen).toHaveBeenCalledWith(entry);
  });
});
