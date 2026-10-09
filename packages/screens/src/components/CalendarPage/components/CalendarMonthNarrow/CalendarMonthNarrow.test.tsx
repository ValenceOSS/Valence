import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { CalendarMonthNarrow } from './CalendarMonthNarrow';

const TODAY = '2026-10-05';

const ASKED = aCalendarEntry({
  id: 'movie:7',
  title: 'A Film',
  episode: null,
  release: 'physical',
  artworkMediaId: null,
  state: 'wanted',
  source: 'request',
  requestedBy: { id: 'sam', name: 'Sam' },
  opens: { kind: 'asking', requestKind: 'film', catalogueId: '7' },
});

const LATER = aCalendarEntry({ id: 'tv:300:s2e6', date: '2026-10-15', title: 'Later Show' });

describe('CalendarMonthNarrow', () => {
  it('heads the card with the day picked', () => {
    render(
      <CalendarMonthNarrow
        day="2026-10-08"
        today={TODAY}
        entries={[]}
        onOpen={vi.fn()}
        onPick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: nameTheDay('2026-10-08', TODAY) }),
    ).toBeInTheDocument();
  });

  it('calls today by name when it is the day picked', () => {
    render(
      <CalendarMonthNarrow
        day={TODAY}
        today={TODAY}
        entries={[]}
        onOpen={vi.fn()}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
  });

  it('lists everything on the day picked in full, and nothing from other days', () => {
    render(
      <CalendarMonthNarrow
        day="2026-10-08"
        today={TODAY}
        entries={[aCalendarEntry(), { ...ASKED, date: '2026-10-08' }, LATER]}
        onOpen={vi.fn()}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByText('A Show')).toBeInTheDocument();
    expect(screen.getByText('S2 E5 · Fifth')).toBeInTheDocument();
    expect(screen.getByText('A Film')).toBeInTheDocument();
    expect(screen.getByText('On disc')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
    expect(screen.queryByText('Later Show')).not.toBeInTheDocument();
  });

  it('says a day with nothing on it has no releases', () => {
    render(
      <CalendarMonthNarrow
        day="2026-10-09"
        today={TODAY}
        entries={[aCalendarEntry()]}
        onOpen={vi.fn()}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByText('No releases')).toBeInTheDocument();
  });

  it('dots each date for what comes out on it', () => {
    render(
      <CalendarMonthNarrow
        day="2026-10-09"
        today={TODAY}
        entries={[aCalendarEntry(), LATER, { ...LATER, id: 'tv:300:s2e7' }]}
        onOpen={vi.fn()}
        onPick={vi.fn()}
      />,
    );

    const dots = (date: string) =>
      screen.getByRole('button', { name: nameTheDay(date, TODAY) }).querySelectorAll('.size-1')
        .length;

    expect(dots('2026-10-08')).toBe(1);
    expect(dots('2026-10-15')).toBe(2);
    expect(dots('2026-10-09')).toBe(0);
  });

  it('picks a day when its date is pressed', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();

    render(
      <CalendarMonthNarrow
        day="2026-10-08"
        today={TODAY}
        entries={[]}
        onOpen={vi.fn()}
        onPick={onPick}
      />,
    );

    await user.click(screen.getByRole('button', { name: nameTheDay('2026-10-21', TODAY) }));

    expect(onPick).toHaveBeenCalledWith('2026-10-21');
  });

  it('opens an entry when pressed', async () => {
    const entry = aCalendarEntry();
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(
      <CalendarMonthNarrow
        day="2026-10-08"
        today={TODAY}
        entries={[entry]}
        onOpen={onOpen}
        onPick={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /A Show/ }));

    expect(onOpen).toHaveBeenCalledWith(entry);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarMonthNarrow.displayName).toBe('CalendarMonthNarrow');
  });
});
