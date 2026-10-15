import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { SeriesBookList } from './SeriesBookList';

const book = (asin: string, title: string, position: string, isCompanion = false) => ({
  asin,
  title,
  position,
  isCompanion,
  author: 'An Author',
  year: 2020,
  openLibraryId: isCompanion && position === '2.6' ? null : 1,
  coverUrl: null,
  narrations: [],
});

const props = () => ({
  request: {
    books: [
      book('B000000001', 'First', '1'),
      book('B000000002', 'Second', '2'),
      book('B000000025', 'Between', '2.5', true),
    ],
    items: [aRequestItem({ id: 'e', title: 'First', format: 'ebook', state: 'available' })],
    approval: 'approved' as const,
    companionsWanted: [],
    keepsOneNarrator: false,
    followsNewSeasons: true,
  },
  isBusy: false,
  onFollowCompanion: vi.fn(),
  onKeepsOneNarrator: vi.fn(),
  onFollowsNew: vi.fn(),
});

describe('SeriesBookList', () => {
  it('lists the books in order, with the formats asked for, and the companions apart', () => {
    render(<SeriesBookList {...props()} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Ebook')).toBeInTheDocument();
    expect(screen.getByText('Also in this world')).toBeInTheDocument();
  });

  it('fetches a companion too, and keeps one narrator, when switched on', async () => {
    const user = userEvent.setup();
    const given = props();

    render(<SeriesBookList {...given} />);

    await user.click(screen.getByRole('switch', { name: 'Fetch Between too' }));
    await user.click(screen.getByRole('switch', { name: 'Keep one narrator across the series' }));

    expect(given.onFollowCompanion).toHaveBeenCalledWith('B000000025', true);
    expect(given.onKeepsOneNarrator).toHaveBeenCalledWith(true);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SeriesBookList.displayName).toBe('SeriesBookList');
  });
});
