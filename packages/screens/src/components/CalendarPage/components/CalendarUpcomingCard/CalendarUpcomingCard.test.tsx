import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { CalendarUpcomingCard } from './CalendarUpcomingCard';

describe('CalendarUpcomingCard', () => {
  it('names it, which episode it is, and where it has got to', () => {
    render(<CalendarUpcomingCard entry={aCalendarEntry()} myId={null} onOpen={vi.fn()} />);

    expect(screen.getByText('A Show')).toBeInTheDocument();
    expect(screen.getByText('S2 E5 · Fifth')).toBeInTheDocument();
    expect(screen.getByText('Not out yet')).toBeInTheDocument();
  });

  it('says nothing of who asked for something nobody asked for', () => {
    render(<CalendarUpcomingCard entry={aCalendarEntry()} myId="me" onOpen={vi.fn()} />);

    expect(screen.queryByText(/Requested by/)).not.toBeInTheDocument();
  });

  it('names who asked for it', () => {
    render(
      <CalendarUpcomingCard
        entry={aCalendarEntry({ requestedBy: { id: 'sam', name: 'Sam' } })}
        myId="me"
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText('Requested by Sam')).toBeInTheDocument();
  });

  it('says a request of your own is yours rather than naming you', () => {
    render(
      <CalendarUpcomingCard
        entry={aCalendarEntry({ requestedBy: { id: 'me', name: 'Ada' } })}
        myId="me"
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText('Requested by you')).toBeInTheDocument();
  });

  it('opens what the library has', async () => {
    const entry = aCalendarEntry({ state: 'available' });
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(<CalendarUpcomingCard entry={entry} myId={null} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(onOpen).toHaveBeenCalledWith(entry);
  });

  it('offers the details of what it does not have yet', async () => {
    const entry = aCalendarEntry();
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(<CalendarUpcomingCard entry={entry} myId={null} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(onOpen).toHaveBeenCalledWith(entry);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarUpcomingCard.displayName).toBe('CalendarUpcomingCard');
  });
});
