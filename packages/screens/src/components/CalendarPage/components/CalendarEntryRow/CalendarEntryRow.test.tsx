import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { CalendarEntryRow } from './CalendarEntryRow';

const ASKED = aCalendarEntry({
  id: 'movie:7',
  title: 'A Film',
  episode: null,
  release: 'cinema',
  artworkMediaId: null,
  posterUrl: 'https://image/poster.jpg',
  state: 'wanted',
  source: 'request',
  requestedBy: { id: 'sam', name: 'Sam' },
  opens: { kind: 'asking', requestKind: 'film', catalogueId: '7' },
});

describe('CalendarEntryRow', () => {
  it('names the show and which episode it is', () => {
    render(<CalendarEntryRow entry={aCalendarEntry()} onOpen={vi.fn()} />);

    expect(screen.getByText('A Show')).toBeInTheDocument();
    expect(screen.getByText('S2 E5 · Fifth')).toBeInTheDocument();
  });

  it('says which release of a film the day is', () => {
    render(<CalendarEntryRow entry={ASKED} onOpen={vi.fn()} />);

    expect(screen.getByText('In cinemas')).toBeInTheDocument();
  });

  it('says where it has got to, and who asked for it', () => {
    render(<CalendarEntryRow entry={ASKED} onOpen={vi.fn()} />);

    expect(screen.getByText('Missing')).not.toHaveClass('sr-only');
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  it('says where it has got to with a sign and leaves out who asked when compact', () => {
    render(<CalendarEntryRow entry={ASKED} onOpen={vi.fn()} isCompact />);

    expect(screen.getByText('Missing')).toHaveClass('sr-only');
    expect(screen.queryByText('Sam')).not.toBeInTheDocument();
  });

  it('draws the catalogue poster of something only asked for', () => {
    const { container } = render(<CalendarEntryRow entry={ASKED} onOpen={vi.fn()} />);

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://image/poster.jpg');
  });

  it('draws the library poster of something the library holds', () => {
    const { container } = render(<CalendarEntryRow entry={aCalendarEntry()} onOpen={vi.fn()} />);

    expect(container.querySelector('img')?.getAttribute('src')).toContain(
      '2b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
    );
  });

  it('leaves the poster blank where there is none', () => {
    const { container } = render(
      <CalendarEntryRow
        entry={aCalendarEntry({ artworkMediaId: null, posterUrl: null })}
        onOpen={vi.fn()}
      />,
    );

    expect(container.querySelector('img')).toBeNull();
  });

  it('opens the entry when pressed', async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(<CalendarEntryRow entry={ASKED} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: /A Film/ }));

    expect(onOpen).toHaveBeenCalledWith(ASKED);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CalendarEntryRow.displayName).toBe('CalendarEntryRow');
  });
});
