import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { CalendarDayGrid } from './CalendarDayGrid';

const TODAY = '2026-10-05';

const dayButton = (date: string) => screen.getByRole('button', { name: nameTheDay(date, TODAY) });

describe('CalendarDayGrid', () => {
  it('offers six whole weeks, Monday first, the days either side of the month among them', () => {
    render(<CalendarDayGrid month="2026-10-15" picked={null} today={TODAY} onPick={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(42);
    expect(dayButton('2026-09-28')).toBeInTheDocument();
    expect(dayButton('2026-11-08')).toBeInTheDocument();
  });

  it('calls today by name', () => {
    render(<CalendarDayGrid month="2026-10-15" picked={null} today={TODAY} onPick={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Today' })).toHaveTextContent('5');
  });

  it('marks the day picked as pressed and no other', () => {
    render(
      <CalendarDayGrid month="2026-10-15" picked="2026-10-20" today={TODAY} onPick={vi.fn()} />,
    );

    expect(dayButton('2026-10-20')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
  });

  it('says which day was pressed', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();

    render(<CalendarDayGrid month="2026-10-15" picked={null} today={TODAY} onPick={onPick} />);

    await user.click(dayButton('2026-10-22'));

    expect(onPick).toHaveBeenCalledWith('2026-10-22');
  });

  it('dots a day for each thing on it, three at most', () => {
    render(
      <CalendarDayGrid
        month="2026-10-15"
        picked={null}
        today={TODAY}
        counts={
          new Map([
            ['2026-10-20', 2],
            ['2026-10-21', 7],
          ])
        }
        onPick={vi.fn()}
      />,
    );

    const dots = (date: string) => dayButton(date).querySelectorAll('.size-1').length;

    expect(dots('2026-10-20')).toBe(2);
    expect(dots('2026-10-21')).toBe(3);
    expect(dots('2026-10-22')).toBe(0);
  });

  it('still offers every day when washing in for somebody who asked for less motion', () => {
    render(
      <MotionConfig reducedMotion="always">
        <CalendarDayGrid
          month="2026-10-15"
          picked={null}
          today={TODAY}
          isArriving
          onPick={vi.fn()}
        />
      </MotionConfig>,
    );

    expect(screen.getAllByRole('button')).toHaveLength(42);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarDayGrid.displayName).toBe('CalendarDayGrid');
  });
});
