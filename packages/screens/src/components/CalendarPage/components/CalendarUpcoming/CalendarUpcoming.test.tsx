import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { CalendarUpcoming } from './CalendarUpcoming';
import type { ReactElement } from 'react';

vi.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () =>
    Promise.resolve({ id: 'me', name: 'Ada', email: 'ada@valence.test', image: null }),
}));

const TODAY = '2026-10-05';

const draw = (ui: ReactElement) => render(ui, { wrapper: CacheScope });

describe('CalendarUpcoming', () => {
  it('heads each day with anything on it, in order, today and tomorrow by name', () => {
    draw(
      <CalendarUpcoming
        entries={[
          aCalendarEntry({ id: 'b', date: '2026-10-08' }),
          aCalendarEntry({ id: 'a', date: TODAY }),
          aCalendarEntry({ id: 'c', date: '2026-10-06' }),
        ]}
        today={TODAY}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'Today',
      'Tomorrow',
      nameTheDay('2026-10-08', TODAY),
    ]);
  });

  it('sets a card under its day for each thing on it', () => {
    draw(
      <CalendarUpcoming
        entries={[
          aCalendarEntry(),
          aCalendarEntry({ id: 'movie:7', title: 'A Film', episode: null, release: 'digital' }),
        ]}
        today={TODAY}
        onOpen={vi.fn()}
      />,
    );

    const day = within(
      screen.getByRole('heading', { name: nameTheDay('2026-10-08', TODAY) }).closest('section') ??
        document.body,
    );

    expect(day.getAllByRole('listitem')).toHaveLength(2);
    expect(day.getByText('S2 E5 · Fifth')).toBeInTheDocument();
    expect(day.getByText('To buy or rent')).toBeInTheDocument();
  });

  it('says a request of your own is yours', async () => {
    draw(
      <CalendarUpcoming
        entries={[aCalendarEntry({ requestedBy: { id: 'me', name: 'Ada' } })]}
        today={TODAY}
        onOpen={vi.fn()}
      />,
    );

    expect(await screen.findByText('Asked by you')).toBeInTheDocument();
  });

  it('draws nothing where nothing is coming', () => {
    draw(<CalendarUpcoming entries={[]} today={TODAY} onOpen={vi.fn()} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('opens an entry when pressed', async () => {
    const entry = aCalendarEntry();
    const onOpen = vi.fn();
    const user = userEvent.setup();

    draw(<CalendarUpcoming entries={[entry]} today={TODAY} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(onOpen).toHaveBeenCalledWith(entry);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarUpcoming.displayName).toBe('CalendarUpcoming');
  });
});
