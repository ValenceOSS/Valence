import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BookRow } from './BookRow';
import type { Book } from '@ValenceContracts/schemas/Book';

const A_BOOK: Book = {
  id: 'b1',
  libraryId: 'l',
  title: 'Emma',
  layout: 'reflow',
  direction: 'leftToRight',
  year: 1815,
  overview: null,
  genres: null,
  authors: ['Jane Austen'],
  rating: null,
  hasCover: true,
  chapterCount: 1,
  addedAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

describe('BookRow', () => {
  it('names the row and each book in it', () => {
    render(<BookRow title="Books" books={[A_BOOK]} onOpen={vi.fn()} />);

    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('Emma')).toBeInTheDocument();
    expect(screen.getByText('Jane Austen')).toBeInTheDocument();
  });

  it('says how far through a book somebody is, in place of who wrote it', () => {
    render(
      <BookRow
        title="Continue reading"
        books={[A_BOOK]}
        progress={new Map([['b1', { fraction: 0.4, detail: '40% read' }]])}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText('40% read')).toBeInTheDocument();
    expect(screen.queryByText('Jane Austen')).not.toBeInTheDocument();
  });

  it('says how many chapters a comic has', () => {
    render(
      <BookRow
        title="Books"
        books={[{ ...A_BOOK, layout: 'fixed', authors: null, chapterCount: 1 }]}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText('1 chapter')).toBeInTheDocument();
  });

  it('opens the book chosen', async () => {
    const onOpen = vi.fn();

    render(<BookRow title="Books" books={[A_BOOK]} onOpen={onOpen} />);

    await userEvent.click(screen.getByText('Emma'));

    expect(onOpen).toHaveBeenCalledWith(A_BOOK);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BookRow.displayName).toBe('BookRow');
  });
});
