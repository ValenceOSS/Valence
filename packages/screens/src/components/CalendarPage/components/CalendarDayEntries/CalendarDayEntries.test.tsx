import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { CalendarDayEntries } from './CalendarDayEntries';

describe('CalendarDayEntries', () => {
  it('lists what the day holds', async () => {
    render(<CalendarDayEntries entries={[aCalendarEntry()]} wait={0} onOpen={vi.fn()} />, {
      wrapper: CacheScope,
    });

    expect(await screen.findByText(/A Show/)).toBeInTheDocument();
  });

  it('says the day is quiet where it holds nothing', () => {
    const { container } = render(<CalendarDayEntries entries={[]} wait={0} onOpen={vi.fn()} />, {
      wrapper: CacheScope,
    });

    expect(container.querySelector('ul')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarDayEntries.displayName).toBe('CalendarDayEntries');
  });
});
