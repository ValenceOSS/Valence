import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { nameTheShortDay } from '@ValenceClient/calendar/nameTheShortDay';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { CalendarPage } from './CalendarPage';
import type * as Calendar from '@ValenceClient/calendar/fetchReleaseCalendar';

const fetchReleaseCalendar = vi.fn<typeof Calendar.fetchReleaseCalendar>();

const may = vi.hoisted(() => vi.fn(() => false));

vi.mock('@ValenceClient/calendar/fetchReleaseCalendar', () => ({
  fetchReleaseCalendar: (...given: Parameters<typeof Calendar.fetchReleaseCalendar>) =>
    fetchReleaseCalendar(...given),
}));

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({ may, mayAdminister: false, isLoading: false }),
}));

vi.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () =>
    Promise.resolve({ id: 'me', name: 'Ada', email: 'ada@valence.test', image: null }),
}));

const TODAY = '2026-10-05';

const ASKED = aCalendarEntry({
  id: 'movie:7',
  date: '2026-10-09',
  title: 'A Film',
  episode: null,
  release: 'cinema',
  artworkMediaId: null,
  state: 'wanted',
  source: 'request',
  requestedBy: { id: 'sam', name: 'Sam' },
  opens: { kind: 'asking', requestKind: 'film', catalogueId: '7' },
});

const dayCard = (name: string) =>
  within(screen.getByRole('heading', { name }).closest('section') ?? document.body);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 5, 12) });
  fetchReleaseCalendar.mockReset().mockResolvedValue([aCalendarEntry(), ASKED]);
  may.mockReset().mockReturnValue(false);
  window.history.replaceState(null, '', '/calendar?view=week');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CalendarPage', () => {
  it('says it is reading the calendar until the server answers', async () => {
    fetchReleaseCalendar.mockReturnValue(new Promise(() => undefined));

    renderInAnAddress(<CalendarPage />);

    expect(await screen.findByRole('status', { name: 'Reading the calendar' })).toBeInTheDocument();
  });

  it('says the calendar could not be read, and offers to try again', async () => {
    const user = userEvent.setup();

    fetchReleaseCalendar.mockRejectedValueOnce(new Error('down'));

    renderInAnAddress(<CalendarPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The calendar could not be read');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Coming up' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reads the week the address names, the viewer’s own requests among it', async () => {
    window.history.replaceState(null, '', '/calendar?view=week&on=2026-10-21');

    renderInAnAddress(<CalendarPage />);

    await screen.findByRole('heading', { name: nameTheShortDay('2026-10-21') });

    expect(fetchReleaseCalendar).toHaveBeenCalledWith('2026-10-19', '2026-10-25', 'mine');
  });

  it('opens on the month around today', async () => {
    window.history.replaceState(null, '', '/calendar');

    renderInAnAddress(<CalendarPage />);

    await screen.findByRole('heading', { name: 'Coming up' });

    expect(fetchReleaseCalendar).toHaveBeenCalledWith('2026-09-28', '2026-11-08', 'mine');
  });

  it('lists the week a day at a time, with what is coming up above it', async () => {
    renderInAnAddress(<CalendarPage />);

    expect(await screen.findByRole('heading', { name: 'Coming up' })).toBeInTheDocument();
    expect(dayCard(nameTheShortDay('2026-10-08')).getByText('A Show')).toBeInTheDocument();
    expect(dayCard(nameTheShortDay('2026-10-09')).getByText('A Film')).toBeInTheDocument();
    expect(dayCard('Today').getByText('No releases')).toBeInTheDocument();
  });

  it('says nothing comes out where a week has nothing in it', async () => {
    fetchReleaseCalendar.mockResolvedValue([]);

    renderInAnAddress(<CalendarPage />);

    expect(await screen.findByText('Nothing comes out on these days')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Coming up' })).not.toBeInTheDocument();
  });

  it('still draws a month with nothing in it, each day saying so', async () => {
    window.history.replaceState(null, '', '/calendar?view=month');
    fetchReleaseCalendar.mockResolvedValue([]);

    renderInAnAddress(<CalendarPage />);

    expect((await screen.findAllByText('No releases')).length).toBeGreaterThan(1);
    expect(screen.queryByText('Nothing comes out on these days')).not.toBeInTheDocument();
  });

  it('lists what is coming without a coming-up row above it', async () => {
    window.history.replaceState(null, '', '/calendar?view=upcoming');

    renderInAnAddress(<CalendarPage />);

    expect(
      await screen.findByRole('heading', { name: nameTheDay('2026-10-08', TODAY) }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Coming up' })).not.toBeInTheDocument();
    expect(fetchReleaseCalendar).toHaveBeenCalledWith('2026-10-05', '2026-12-03', 'mine');
  });

  it('opens the show an episode is of', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<CalendarPage />);

    await user.click(
      await screen.findByRole('button', { name: `A Show, ${nameTheDay('2026-10-08', TODAY)}` }),
    );

    expect(new URLSearchParams(window.location.search).get('show')).toBe('series-1');
  });

  it('opens the details of something only asked for', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<CalendarPage />);

    await screen.findByRole('heading', { name: nameTheShortDay('2026-10-09') });
    await user.click(
      dayCard(nameTheShortDay('2026-10-09')).getByRole('button', { name: /A Film/ }),
    );

    expect(new URLSearchParams(window.location.search).get('ask')).toBe('film:7');
  });

  it('opens a title the library holds', async () => {
    const user = userEvent.setup();

    fetchReleaseCalendar.mockResolvedValue([
      aCalendarEntry({ opens: { kind: 'item', mediaId: 'film-1' }, title: 'A Held Film' }),
    ]);

    renderInAnAddress(<CalendarPage />);

    await screen.findByRole('heading', { name: nameTheShortDay('2026-10-08') });
    await user.click(
      dayCard(nameTheShortDay('2026-10-08')).getByRole('button', { name: /A Held Film/ }),
    );

    expect(new URLSearchParams(window.location.search).get('item')).toBe('film-1');
  });

  it('switches view from the toolbar, keeping it in the address', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<CalendarPage />);

    await screen.findByRole('heading', { name: 'Coming up' });
    await user.click(
      within(screen.getByRole('group', { name: 'Calendar views' })).getByRole('button', {
        name: 'Upcoming',
      }),
    );

    expect(new URLSearchParams(window.location.search).get('view')).toBe('upcoming');
    expect(await screen.findByRole('heading', { level: 1, name: 'Upcoming' })).toBeInTheDocument();
  });

  it('turns a week on from the toolbar', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<CalendarPage />);

    await screen.findByRole('heading', { name: 'Coming up' });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(new URLSearchParams(window.location.search).get('on')).toBe('2026-10-12');
    expect(fetchReleaseCalendar).toHaveBeenLastCalledWith('2026-10-12', '2026-10-18', 'mine');
  });

  it('opens the week of a day with more on it than the month has room for', async () => {
    const user = userEvent.setup();

    window.history.replaceState(null, '', '/calendar?view=month');
    fetchReleaseCalendar.mockResolvedValue(
      Array.from({ length: 4 }, (_, at) =>
        aCalendarEntry({ id: `tv:300:s2e${(at + 1).toString()}` }),
      ),
    );

    renderInAnAddress(<CalendarPage />);

    await user.click(await screen.findByRole('button', { name: '1 more' }));

    const address = new URLSearchParams(window.location.search);

    expect(address.get('view')).toBe('week');
    expect(address.get('on')).toBe('2026-10-08');
  });

  it('reads everybody’s requests for somebody who may see them and asks to', async () => {
    const user = userEvent.setup();

    may.mockReturnValue(true);

    renderInAnAddress(<CalendarPage />);

    await screen.findByRole('heading', { name: 'Coming up' });
    await user.click(screen.getByRole('button', { name: /Narrow the calendar/ }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: /Everyone/ }));

    expect(fetchReleaseCalendar).toHaveBeenLastCalledWith('2026-10-05', '2026-10-11', 'everyone');
  });

  it('offers nobody else’s requests to somebody who may not see them', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<CalendarPage />);

    await screen.findByRole('heading', { name: 'Coming up' });
    await user.click(screen.getByRole('button', { name: /Narrow the calendar/ }));
    await screen.findByRole('menuitemcheckbox', { name: /Films/ });

    expect(screen.queryByRole('menuitemcheckbox', { name: /Everyone/ })).not.toBeInTheDocument();
  });

  it('narrows what it shows to what is chosen', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<CalendarPage />);

    await screen.findByRole('heading', { name: 'Coming up' });
    await user.click(screen.getByRole('button', { name: /Narrow the calendar/ }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: /Films/ }));
    await user.keyboard('{Escape}');

    expect(dayCard(nameTheShortDay('2026-10-09')).getByText('A Film')).toBeInTheDocument();
    expect(dayCard(nameTheShortDay('2026-10-08')).queryByText('A Show')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarPage.displayName).toBe('CalendarPage');
  });
});
