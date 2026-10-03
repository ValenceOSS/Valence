import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { nameTheMonth } from '@ValenceClient/calendar/nameTheMonth';
import { nameTheWeek } from '@ValenceClient/calendar/nameTheWeek';
import { describeCalendarFilters } from '@ValenceScreens/calendar/describeCalendarFilters';
import { CalendarToolbar } from './CalendarToolbar';
import type { CalendarToolbarProps } from './CalendarToolbar.types';

const TODAY = '2026-10-05';

const draw = (overrides: Partial<CalendarToolbarProps> = {}) => {
  const props: CalendarToolbarProps = {
    view: 'month',
    day: '2026-10-08',
    today: TODAY,
    filters: describeCalendarFilters(false),
    selected: new Set(),
    onView: vi.fn(),
    onTurn: vi.fn(),
    onPickDay: vi.fn(),
    onFilter: vi.fn(),
    ...overrides,
  };

  render(<CalendarToolbar {...props} />, { wrapper: CacheScope });

  return props;
};

describe('CalendarToolbar', () => {
  it('heads a month with its name', () => {
    draw();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(nameTheMonth('2026-10-08'));
  });

  it('heads a week with the days it spans', () => {
    draw({ view: 'week' });

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(nameTheWeek('2026-10-08'));
  });

  it('heads the upcoming list as such, with nothing to turn', () => {
    draw({ view: 'upcoming' });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Upcoming');
    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Go to a day' })).not.toBeInTheDocument();
  });

  it('turns a page back and on', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(props.onTurn).toHaveBeenNthCalledWith(1, -1);
    expect(props.onTurn).toHaveBeenNthCalledWith(2, 1);
  });

  it('turns to a day picked', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.click(screen.getByRole('button', { name: 'Go to a day' }));
    await user.click(await screen.findByRole('button', { name: nameTheDay('2026-10-20', TODAY) }));

    expect(props.onPickDay).toHaveBeenCalledWith('2026-10-20');
  });

  it('marks the view shown and switches to another', async () => {
    const user = userEvent.setup();
    const props = draw();
    const views = within(screen.getByRole('group', { name: 'Calendar views' }));

    expect(views.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(views.getByRole('button', { name: 'Week' }));
    await user.click(views.getByRole('button', { name: 'Upcoming' }));

    expect(props.onView).toHaveBeenNthCalledWith(1, 'week');
    expect(props.onView).toHaveBeenNthCalledWith(2, 'upcoming');
  });

  it('offers to add the calendar to a calendar app', () => {
    draw();

    expect(screen.getByRole('button', { name: 'Add to Calendar' })).toBeInTheDocument();
  });

  it('offers a way to narrow the calendar', () => {
    draw();

    expect(screen.getByRole('button', { name: /Narrow the calendar/ })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarToolbar.displayName).toBe('CalendarToolbar');
  });
});
