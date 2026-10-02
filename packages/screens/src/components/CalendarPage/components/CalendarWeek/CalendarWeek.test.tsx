import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { nameTheShortDay } from '@ValenceClient/calendar/nameTheShortDay';
import { CalendarWeek } from './CalendarWeek';

const TODAY = '2026-10-06';

const dayCard = (name: string) => {
  const card = screen.getByRole('heading', { name }).closest('section');

  return within(card ?? document.body);
};

describe('CalendarWeek', () => {
  it('draws the seven days of the week, Monday first, calling today by name', () => {
    render(<CalendarWeek day="2026-10-08" today={TODAY} entries={[]} onOpen={vi.fn()} />);

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      nameTheShortDay('2026-10-05'),
      'Today',
      nameTheShortDay('2026-10-07'),
      nameTheShortDay('2026-10-08'),
      nameTheShortDay('2026-10-09'),
      nameTheShortDay('2026-10-10'),
      nameTheShortDay('2026-10-11'),
    ]);
  });

  it('lists everything on a day under it', () => {
    render(
      <CalendarWeek
        day="2026-10-08"
        today={TODAY}
        entries={[
          aCalendarEntry(),
          aCalendarEntry({ id: 'tv:300:s2e6', title: 'Another Show' }),
          aCalendarEntry({ id: 'tv:300:s2e7', title: 'A Third', state: 'available' }),
          aCalendarEntry({ id: 'tv:300:s2e8', title: 'A Fourth' }),
        ]}
        onOpen={vi.fn()}
      />,
    );

    const thursday = dayCard(nameTheShortDay('2026-10-08'));

    expect(thursday.getAllByRole('listitem')).toHaveLength(4);
    expect(thursday.getByText('Another Show')).toBeInTheDocument();
    expect(thursday.getByText('Available')).toBeInTheDocument();
  });

  it('says each day with nothing on it has no releases', () => {
    render(
      <CalendarWeek day="2026-10-08" today={TODAY} entries={[aCalendarEntry()]} onOpen={vi.fn()} />,
    );

    expect(screen.getAllByText('No releases')).toHaveLength(6);
    expect(
      dayCard(nameTheShortDay('2026-10-08')).queryByText('No releases'),
    ).not.toBeInTheDocument();
  });

  it('opens an entry when pressed', async () => {
    const entry = aCalendarEntry();
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(<CalendarWeek day="2026-10-08" today={TODAY} entries={[entry]} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: /A Show/ }));

    expect(onOpen).toHaveBeenCalledWith(entry);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarWeek.displayName).toBe('CalendarWeek');
  });
});
