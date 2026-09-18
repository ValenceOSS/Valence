import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { GuestReader } from './GuestReader';
import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';

const BOOK_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001';

const CHAPTER_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0002';

const A_BOOK: Book = {
  id: BOOK_ID,
  libraryId: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
  title: 'Rent-A-Girlfriend',
  layout: 'fixed',
  direction: 'rightToLeft',
  year: null,
  overview: null,
  genres: null,
  authors: null,
  rating: null,
  hasCover: true,
  chapterCount: 1,
  addedAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const A_CHAPTER: BookChapter = {
  id: CHAPTER_ID,
  bookId: BOOK_ID,
  number: 1,
  title: 'Volume 1',
  format: 'cbz',
  pageCount: 12,
  addedAt: '2026-09-18T00:00:00.000Z',
};

const held = new Map<string, string>();

beforeEach(() => {
  held.clear();
  installATestClient({
    store: {
      read: (key) => held.get(key) ?? null,
      write: (key, value) => {
        held.set(key, value);
      },
      forget: (key) => {
        held.delete(key);
      },
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ book: A_BOOK, chapters: [A_CHAPTER] }), { status: 200 }),
      ),
    ),
  );
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('GuestReader', () => {
  it('opens a shared book of pages in the page reader', async () => {
    renderInAnAddress(<GuestReader book={A_BOOK} onClose={vi.fn()} />);

    expect(await screen.findByRole('img', { name: 'Page 1' })).toBeInTheDocument();
  });

  it('opens where the guest left off on this device', async () => {
    held.set(
      `valence.shared.${BOOK_ID}`,
      JSON.stringify({ chapterId: CHAPTER_ID, pageNumber: 4, fraction: null }),
    );

    renderInAnAddress(<GuestReader book={A_BOOK} onClose={vi.fn()} />);

    expect(await screen.findByRole('img', { name: 'Page 5' })).toBeInTheDocument();
  });

  it('keeps the guest’s place on this device and nowhere else', async () => {
    renderInAnAddress(<GuestReader book={A_BOOK} onClose={vi.fn()} />);

    await screen.findByRole('img', { name: 'Page 1' });

    expect(held.get(`valence.shared.${BOOK_ID}`)).toContain(`"chapterId":"${CHAPTER_ID}"`);
    expect(vi.mocked(fetch).mock.calls.every(([, init]) => init?.method !== 'PUT')).toBe(true);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(GuestReader.displayName).toBe('GuestReader');
  });
});
