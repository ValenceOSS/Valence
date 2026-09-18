import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAShell } from '@ValenceScreens/testing/renderInAShell';
import { BookDialog } from './BookDialog';
import type { Book, BookReading } from '@ValenceContracts/schemas/Book';

const BOOK_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001';

const A_BOOK: Book = {
  id: BOOK_ID,
  libraryId: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
  title: 'Pride and Prejudice',
  layout: 'reflow',
  direction: 'leftToRight',
  year: 1813,
  overview: 'It is a truth universally acknowledged.',
  genres: ['Romance'],
  authors: ['Jane Austen'],
  rating: null,
  hasCover: true,
  chapterCount: 1,
  addedAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

/**
 * Serves the book, where somebody is in it, and nothing rated.
 */
const serve = (readings: BookReading[] = []) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string) => {
      const answers: Record<string, object> = {
        [`/api/books/${BOOK_ID}`]: { book: A_BOOK, chapters: [] },
        '/api/reading': { readings },
        '/api/ratings': { ratings: [] },
        [`/api/books/${BOOK_ID}/rating/household`]: { average: null, count: 0 },
      };
      const body = answers[input];

      return Promise.resolve(
        body === undefined
          ? new Response('{}', { status: 404 })
          : new Response(JSON.stringify(body), { status: 200 }),
      );
    }),
  );
};

/**
 * Opens the dialog on the book.
 */
const open = (overrides: Partial<Parameters<typeof BookDialog>[0]> = {}) => {
  const handlers = {
    onClose: vi.fn(),
    onRead: vi.fn(),
    onToggleKept: vi.fn(),
    onRate: vi.fn(),
    onShare: vi.fn(),
  };

  renderInAShell(<BookDialog bookId={BOOK_ID} isKept={false} {...handlers} {...overrides} />);

  return handlers;
};

beforeEach(() => {
  installATestClient();
  serve();
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('BookDialog', () => {
  it('says what the book is, who wrote it and what it is about', async () => {
    open();

    expect(await screen.findByRole('heading', { name: 'Pride and Prejudice' })).toBeInTheDocument();
    expect(screen.getByText('Jane Austen · 1813')).toBeInTheDocument();
    expect(screen.getByText('It is a truth universally acknowledged.')).toBeInTheDocument();
    expect(screen.getByText('Romance')).toBeInTheDocument();
  });

  it('offers to start a book nobody has opened', async () => {
    const { onRead } = open();

    await userEvent.click(await screen.findByRole('button', { name: 'Read' }));

    expect(onRead).toHaveBeenCalledWith(A_BOOK);
  });

  it('offers to carry on with a book somebody is partway through, saying how far', async () => {
    serve([
      {
        book: A_BOOK,
        chapterId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0002',
        chapterTitle: 'Pride and Prejudice',
        pageNumber: null,
        pageCount: null,
        fraction: 0.34,
        isFinished: false,
        updatedAt: '2026-09-18T00:00:00.000Z',
      },
    ]);

    open();

    expect(await screen.findByRole('button', { name: 'Continue reading' })).toBeInTheDocument();
    expect(screen.getByText('34% read')).toBeInTheDocument();
  });

  it('keeps the book, and shares it', async () => {
    const { onToggleKept, onShare } = open();

    await screen.findByRole('heading', { name: 'Pride and Prejudice' });
    await userEvent.click(screen.getByRole('button', { name: /Keep/ }));
    await userEvent.click(screen.getByRole('button', { name: /Share/ }));

    expect(onToggleKept).toHaveBeenCalledWith(A_BOOK);
    expect(onShare).toHaveBeenCalledWith(A_BOOK);
  });

  it('says a kept book can stop being kept', async () => {
    open({ isKept: true });

    expect(await screen.findByRole('button', { name: /Stop keeping/ })).toBeInTheDocument();
  });

  it('shows nothing while no book is chosen', () => {
    open({ bookId: null });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BookDialog.displayName).toBe('BookDialog');
  });
});
