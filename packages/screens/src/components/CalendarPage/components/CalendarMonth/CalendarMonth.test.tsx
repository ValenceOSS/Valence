import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { CalendarMonth } from './CalendarMonth';

const TODAY = '2026-10-05';

const dayCard = (dayOfMonth: string, at = 0) => {
  const card = screen.getAllByRole('heading', { name: dayOfMonth })[at]?.closest('section');

  return within(card ?? document.body);
};

const onTheEighth = (count: number) =>
  Array.from({ length: count }, (_, at) =>
    aCalendarEntry({
      id: `tv:300:s2e${(at + 1).toString()}`,
      title: `Show ${(at + 1).toString()}`,
    }),
  );

describe('CalendarMonth', () => {
  it('draws a card for each of the six weeks of days', () => {
    render(
      <CalendarMonth
        day="2026-10-08"
        today={TODAY}
        entries={[]}
        onOpen={vi.fn()}
        onOpenWeek={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('heading')).toHaveLength(42);
  });

  it('says a day with nothing on it has no releases', () => {
    render(
      <CalendarMonth
        day="2026-10-08"
        today={TODAY}
        entries={[aCalendarEntry()]}
        onOpen={vi.fn()}
        onOpenWeek={vi.fn()}
      />,
    );

    expect(screen.getAllByText('No releases')).toHaveLength(41);
    expect(dayCard('8').queryByText('No releases')).not.toBeInTheDocument();
  });

  it('lists what comes out on a day, with where it has got to', () => {
    render(
      <CalendarMonth
        day="2026-10-08"
        today={TODAY}
        entries={[aCalendarEntry()]}
        onOpen={vi.fn()}
        onOpenWeek={vi.fn()}
      />,
    );

    expect(dayCard('8').getByText('A Show')).toBeInTheDocument();
    expect(dayCard('8').getByText('S2 E5 · Fifth')).toBeInTheDocument();
    expect(dayCard('8').getByText('Not out yet')).toBeInTheDocument();
  });

  it('opens an entry when pressed', async () => {
    const entry = aCalendarEntry();
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(
      <CalendarMonth
        day="2026-10-08"
        today={TODAY}
        entries={[entry]}
        onOpen={onOpen}
        onOpenWeek={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /A Show/ }));

    expect(onOpen).toHaveBeenCalledWith(entry);
  });

  it('lists three a day and offers to open the week for the rest', async () => {
    const onOpenWeek = vi.fn();
    const user = userEvent.setup();

    render(
      <CalendarMonth
        day="2026-10-08"
        today={TODAY}
        entries={onTheEighth(5)}
        onOpen={vi.fn()}
        onOpenWeek={onOpenWeek}
      />,
    );

    expect(dayCard('8').getAllByRole('listitem')).toHaveLength(3);
    expect(dayCard('8').queryByText('Show 4')).not.toBeInTheDocument();

    await user.click(dayCard('8').getByRole('button', { name: '2 more' }));

    expect(onOpenWeek).toHaveBeenCalledWith('2026-10-08');
  });

  it('offers no more where three fit', () => {
    render(
      <CalendarMonth
        day="2026-10-08"
        today={TODAY}
        entries={onTheEighth(3)}
        onOpen={vi.fn()}
        onOpenWeek={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /more/ })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarMonth.displayName).toBe('CalendarMonth');
  });
});
