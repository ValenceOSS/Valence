import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { nameTheMonth } from '@ValenceClient/calendar/nameTheMonth';
import { CalendarDayPicker } from './CalendarDayPicker';

const TODAY = '2027-03-01';

describe('CalendarDayPicker', () => {
  it('opens on the month the calendar is turned to', async () => {
    const user = userEvent.setup();

    render(<CalendarDayPicker day="2026-12-15" today={TODAY} onPick={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Go to a day' }));

    expect(await screen.findByText(nameTheMonth('2026-12-01'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: nameTheDay('2026-12-15', TODAY) })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('turns a month on, into the next year', async () => {
    const user = userEvent.setup();

    render(<CalendarDayPicker day="2026-12-31" today={TODAY} onPick={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Go to a day' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));

    expect(screen.getByText(nameTheMonth('2027-01-01'))).toBeInTheDocument();
  });

  it('turns a month back, into the year before', async () => {
    const user = userEvent.setup();

    render(<CalendarDayPicker day="2027-01-31" today={TODAY} onPick={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Go to a day' }));
    await user.click(await screen.findByRole('button', { name: 'Previous' }));

    expect(screen.getByText(nameTheMonth('2026-12-01'))).toBeInTheDocument();
  });

  it('says which day was picked and closes', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();

    render(<CalendarDayPicker day="2026-12-15" today={TODAY} onPick={onPick} />);

    await user.click(screen.getByRole('button', { name: 'Go to a day' }));
    await user.click(await screen.findByRole('button', { name: nameTheDay('2026-12-24', TODAY) }));

    expect(onPick).toHaveBeenCalledWith('2026-12-24');
    await waitFor(() => {
      expect(screen.queryByText(nameTheMonth('2026-12-01'))).not.toBeInTheDocument();
    });
  });

  it('goes straight back to today', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();

    render(<CalendarDayPicker day="2026-12-15" today={TODAY} onPick={onPick} />);

    await user.click(screen.getByRole('button', { name: 'Go to a day' }));
    await user.click(await screen.findByRole('button', { name: 'Today' }));

    expect(onPick).toHaveBeenCalledWith(TODAY);
  });

  it('opens again on the day the calendar is turned to, not the month last looked at', async () => {
    const user = userEvent.setup();

    render(<CalendarDayPicker day="2026-12-15" today={TODAY} onPick={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Go to a day' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText(nameTheMonth('2027-01-01'))).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Go to a day' }));

    expect(await screen.findByText(nameTheMonth('2026-12-01'))).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarDayPicker.displayName).toBe('CalendarDayPicker');
  });
});
