import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAShell } from '@ValenceScreens/testing/renderInAShell';
import { BookDialog } from './BookDialog';
import type {
  BookChapter,
  ReadingProgress,
  Book,
  BookDetail,
  BookReading,
  ListeningProgress,
} from '@ValenceContracts/schemas/Book';

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
 * Serves the book, where somebody is in it and has got to hearing it, and nothing rated.
 */
const serve = (
  readings: BookReading[] = [],
  book: Book = A_BOOK,
  heard: ListeningProgress | null = null,
  chapters: BookChapter[] = [],
  progress: ReadingProgress[] = [],
) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string) => {
      const answers: Record<string, object> = {
        [`/api/books/${BOOK_ID}`]: { book, chapters },
        [`/api/books/${BOOK_ID}/progress`]: { progress },
        '/api/reading': { readings },
        [`/api/books/${BOOK_ID}/listening`]: { progress: heard },
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
    onReadChapter: vi.fn(),
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

  it('says a book that is only heard is an audiobook, with nothing to read', async () => {
    serve([], { ...A_BOOK, layout: 'audio', hasText: false, hasAudio: true });
    open();

    expect(await screen.findByText('Audiobook')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read' })).toBeDisabled();
  });

  it('offers to listen to a book that is only heard, in place of reading it', async () => {
    const onListen = vi.fn<(detail: BookDetail) => void>();

    serve([], { ...A_BOOK, layout: 'audio', hasText: false, hasAudio: true });
    open({ onListen });

    await userEvent.click(await screen.findByRole('button', { name: 'Listen' }));

    expect(onListen.mock.calls[0]?.[0].book.id).toBe(BOOK_ID);
    expect(screen.queryByRole('button', { name: 'Read' })).not.toBeInTheDocument();
  });

  it('offers to carry on listening where somebody left off, or to listen again', async () => {
    const place = {
      bookId: BOOK_ID,
      chapterId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c00cc',
      positionSeconds: 30,
      isFinished: false,
      updatedAt: '2026-09-18T00:00:00.000Z',
    };

    serve([], { ...A_BOOK, layout: 'audio', hasText: false, hasAudio: true }, place);
    open({ onListen: vi.fn() });

    expect(await screen.findByRole('button', { name: 'Continue listening' })).toBeInTheDocument();
  });

  it('offers listening beside reading, for a book that can be both', async () => {
    const onListen = vi.fn();

    serve([], { ...A_BOOK, hasText: true, hasAudio: true });
    open({ onListen });

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Read' })).toBeEnabled();
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Listen' }));

    expect(onListen).toHaveBeenCalled();
  });

  it('offers no listening where nothing is there to hear it with', async () => {
    serve([], { ...A_BOOK, hasText: true, hasAudio: true });
    open();

    expect(await screen.findByRole('button', { name: 'Read' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Listen' })).not.toBeInTheDocument();
  });

  it('says a book that can be read and heard is both', async () => {
    serve([], { ...A_BOOK, hasText: true, hasAudio: true });
    open();

    expect(await screen.findByText('Ebook and audiobook')).toBeInTheDocument();
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

  it('lists the chapters, how many pages each runs to and how much is read, and opens the one chosen', async () => {
    const chapter = (id: string, number: number, title: string): BookChapter => ({
      id,
      bookId: BOOK_ID,
      number,
      title,
      format: 'cbz',
      pageCount: 10,
      addedAt: '2026-09-18T00:00:00.000Z',
    });

    serve(
      [],
      A_BOOK,
      null,
      [
        chapter(`${BOOK_ID.slice(0, -2)}11`, 1, 'One'),
        chapter(`${BOOK_ID.slice(0, -2)}12`, 2, 'Two'),
      ],
      [
        {
          bookId: BOOK_ID,
          chapterId: `${BOOK_ID.slice(0, -2)}11`,
          pageNumber: null,
          fraction: null,
          isFinished: true,
          updatedAt: '2026-09-18T00:00:00.000Z',
        },
      ],
    );

    const { onReadChapter } = open();
    const list = await screen.findByRole('list', { name: 'Chapters' });

    expect(within(list).getAllByText('10 pages')).toHaveLength(2);
    expect(await within(list).findByRole('img', { name: 'Read' })).toBeInTheDocument();

    await userEvent.click(within(list).getByRole('button', { name: 'Read Two' }));

    expect(onReadChapter).toHaveBeenCalledWith(A_BOOK, `${BOOK_ID.slice(0, -2)}12`);
  });
});
