import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { ReadPage } from './ReadPage';
import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';
import type * as Router from '@tanstack/react-router';

const address = vi.hoisted((): { chapter: string | undefined } => ({ chapter: undefined }));

vi.mock('@tanstack/react-router', async (original) => ({
  ...(await original<typeof Router>()),
  useParams: () => ({ bookId: BOOK_ID }),
  useSearch: () => (address.chapter === undefined ? {} : { chapter: address.chapter }),
}));

const BOOK_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001';

const CHAPTER_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0002';

const A_BOOK: Book = {
  id: BOOK_ID,
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

const A_CHAPTER: BookChapter = {
  id: CHAPTER_ID,
  bookId: BOOK_ID,
  number: 0,
  title: 'Pride and Prejudice',
  format: 'epub',
  pageCount: null,
  addedAt: '2026-09-18T00:00:00.000Z',
};

/**
 * Serves one book, of whichever layout, and what reading it asks for.
 */
const serve = (book: Book, chapters: BookChapter[]) => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string) => {
      const answers: Record<string, string> = {
        [`/api/books/${BOOK_ID}`]: JSON.stringify({ book, chapters }),
        [`/api/books/${BOOK_ID}/progress`]: JSON.stringify({ progress: [] }),
        [`/api/books/${BOOK_ID}/chapters/${CHAPTER_ID}/contents`]: JSON.stringify({
          parts: [{ size: 10 }],
          contents: [{ title: 'Chapter I.', part: 0, anchor: null, depth: 0 }],
        }),
        [`/api/books/${BOOK_ID}/chapters/${CHAPTER_ID}/document?part=0`]:
          '<p>It is a truth universally acknowledged.</p>',
      };
      const body = answers[input];

      return Promise.resolve(
        body === undefined
          ? new Response('{}', { status: 404 })
          : new Response(body, { status: 200 }),
      );
    }),
  );
};

beforeEach(() => {
  installATestClient();
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('ReadPage', () => {
  it('opens a book whose text reflows in the text reader', async () => {
    serve(A_BOOK, [A_CHAPTER]);

    renderInAnAddress(<ReadPage />);

    expect(await screen.findByText('It is a truth universally acknowledged.')).toBeInTheDocument();
  });

  it('opens a book of fixed pages in the page reader', async () => {
    serve({ ...A_BOOK, layout: 'fixed', direction: 'rightToLeft' }, [
      { ...A_CHAPTER, format: 'cbz', pageCount: 12 },
    ]);

    renderInAnAddress(<ReadPage />);

    expect(await screen.findByRole('img', { name: 'Page 1' })).toBeInTheDocument();
  });

  it('opens at the chapter the address names', async () => {
    address.chapter = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0009';
    serve({ ...A_BOOK, layout: 'fixed', direction: 'rightToLeft' }, [
      { ...A_CHAPTER, format: 'cbz', pageCount: 12, title: 'One' },
      {
        ...A_CHAPTER,
        id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0009',
        number: 2,
        format: 'cbz',
        pageCount: 8,
        title: 'Two',
      },
    ]);

    renderInAnAddress(<ReadPage />);

    expect(await screen.findByText(/Two/)).toBeInTheDocument();
    address.chapter = undefined;
  });

  it('says there is nothing to read in a book that is only heard', async () => {
    serve({ ...A_BOOK, layout: 'audio' }, [{ ...A_CHAPTER, format: 'm4b', durationSeconds: 3600 }]);

    renderInAnAddress(<ReadPage />);

    expect(await screen.findByText('Nothing in this book yet')).toBeInTheDocument();
  });

  it('opens the text of a book that can be heard as well, leaving the audio out', async () => {
    serve({ ...A_BOOK, hasAudio: true }, [
      { ...A_CHAPTER, id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0003', number: 0, format: 'm4b' },
      A_CHAPTER,
    ]);

    renderInAnAddress(<ReadPage />);

    expect(await screen.findByText('It is a truth universally acknowledged.')).toBeInTheDocument();
  });

  it('says so when a book has nothing in it yet', async () => {
    serve(A_BOOK, []);

    renderInAnAddress(<ReadPage />);

    expect(await screen.findByText('Nothing in this book yet')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReadPage.displayName).toBe('ReadPage');
  });
});
