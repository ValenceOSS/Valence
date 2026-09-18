import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { BookRail } from './BookRail';
import type { Book } from '@ValenceContracts/schemas/Book';

const A_BOOK: Book = {
  id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001',
  libraryId: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
  title: 'Pride and Prejudice',
  layout: 'reflow',
  direction: 'leftToRight',
  year: 1813,
  overview: null,
  genres: null,
  authors: ['Jane Austen'],
  rating: null,
  hasCover: true,
  chapterCount: 1,
  addedAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

/**
 * Serves a shelf holding the given books.
 */
const serve = (books: Book[]) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify({ books }), { status: 200 }))),
  );
};

beforeEach(() => {
  serve([
    A_BOOK,
    {
      ...A_BOOK,
      id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0002',
      title: 'Alice’s Adventures in Wonderland',
      authors: null,
    },
    {
      ...A_BOOK,
      id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0003',
      title: 'Rent-A-Girlfriend',
      layout: 'fixed',
      authors: null,
      chapterCount: 38,
    },
  ]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BookRail', () => {
  it('says who wrote an ebook', async () => {
    renderInAnAddress(<BookRail libraryId="shelf" title="Books" onOpen={vi.fn()} />);

    expect(await screen.findByText('Jane Austen')).toBeInTheDocument();
  });

  it('calls an ebook an ebook where it names nobody', async () => {
    renderInAnAddress(<BookRail libraryId="shelf" title="Books" onOpen={vi.fn()} />);

    expect(await screen.findByText('Ebook')).toBeInTheDocument();
  });

  it('says how many chapters a comic has', async () => {
    renderInAnAddress(<BookRail libraryId="shelf" title="Books" onOpen={vi.fn()} />);

    expect(await screen.findByText('38 chapters')).toBeInTheDocument();
  });

  it('opens the book chosen', async () => {
    const onOpen = vi.fn();

    renderInAnAddress(<BookRail libraryId="shelf" title="Books" onOpen={onOpen} />);

    await userEvent.click(await screen.findByText('Pride and Prejudice'));

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: A_BOOK.id }));
  });

  it('draws nothing for an empty shelf', async () => {
    serve([]);

    const { container } = renderInAnAddress(
      <BookRail libraryId="shelf" title="Books" onOpen={vi.fn()} />,
    );

    await vi.waitFor(() => {
      expect(container.querySelector('[class*="Skeleton"], .animate-pulse')).toBeNull();
    });
    expect(screen.queryByText('Books')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BookRail.displayName).toBe('BookRail');
  });
});
