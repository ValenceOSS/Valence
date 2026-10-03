import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { CalendarUpNext } from './CalendarUpNext';

const TODAY = '2026-10-05';

const onDays = (...dates: string[]) =>
  dates.map((date, at) =>
    aCalendarEntry({ id: `tv:300:s2e${(at + 1).toString()}`, date, title: `Show ${date}` }),
  );

describe('CalendarUpNext', () => {
  it('heads the next few things to come out as coming up', () => {
    render(<CalendarUpNext entries={[aCalendarEntry()]} today={TODAY} onOpen={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Coming up' })).toBeInTheDocument();
  });

  it('flags each with the day it comes out and says which episode it is', () => {
    render(
      <CalendarUpNext
        entries={[aCalendarEntry({ date: '2026-10-06' })]}
        today={TODAY}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'A Show, Tomorrow' })).toBeInTheDocument();
    expect(screen.getByText('S2 E5 · Fifth')).toBeInTheDocument();
  });

  it('shows at most four, from today on', () => {
    render(
      <CalendarUpNext
        entries={onDays(
          '2026-10-01',
          '2026-10-05',
          '2026-10-06',
          '2026-10-07',
          '2026-10-08',
          '2026-10-09',
        )}
        today={TODAY}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getAllByRole('button').map((card) => card.getAttribute('aria-label'))).toEqual([
      'Show 2026-10-05, Today',
      'Show 2026-10-06, Tomorrow',
      `Show 2026-10-07, ${nameTheDay('2026-10-07', TODAY)}`,
      `Show 2026-10-08, ${nameTheDay('2026-10-08', TODAY)}`,
    ]);
  });

  it('says nothing where nothing is still to come', () => {
    const { container } = render(
      <CalendarUpNext
        entries={onDays('2026-10-01', '2026-10-04')}
        today={TODAY}
        onOpen={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('opens an entry when pressed', async () => {
    const entry = aCalendarEntry();
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(<CalendarUpNext entries={[entry]} today={TODAY} onOpen={onOpen} />);

    await user.click(
      screen.getByRole('button', { name: `A Show, ${nameTheDay('2026-10-08', TODAY)}` }),
    );

    expect(onOpen).toHaveBeenCalledWith(entry);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarUpNext.displayName).toBe('CalendarUpNext');
  });
});
