import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ContinueReading } from './ContinueReading';
import type { BookReading } from '@ValenceContracts/schemas/Book';

const IDS: Record<string, string> = {
  a: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c000a',
  b: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c000b',
};

const reading = (id: string, overrides: Partial<BookReading> = {}): BookReading => ({
  book: {
    id: IDS[id] ?? id,
    libraryId: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
    title: `Book ${id}`,
    layout: 'reflow',
    direction: 'leftToRight',
    year: null,
    overview: null,
    genres: null,
    authors: null,
    rating: null,
    hasCover: true,
    chapterCount: 1,
    addedAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
  },
  chapterId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c00cc',
  chapterTitle: `Book ${id}`,
  pageNumber: null,
  pageCount: null,
  fraction: 0.5,
  isFinished: false,
  updatedAt: '2026-09-18T00:00:00.000Z',
  ...overrides,
});

/**
 * Serves what somebody has been reading.
 */
const serve = (readings: BookReading[]) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify({ readings }), { status: 200 }))),
  );
};

beforeEach(() => {
  installATestClient();
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('ContinueReading', () => {
  it('lists the books somebody is partway through, saying how far', async () => {
    serve([reading('a')]);

    renderInAnAddress(<ContinueReading onOpen={vi.fn()} />);

    expect(await screen.findByText('Continue reading')).toBeInTheDocument();
    expect(screen.getByText('50% read')).toBeInTheDocument();
  });

  it('leaves out a book somebody has finished', async () => {
    serve([reading('a'), reading('b', { isFinished: true })]);

    renderInAnAddress(<ContinueReading onOpen={vi.fn()} />);

    expect(await screen.findByText('Book a')).toBeInTheDocument();
    expect(screen.queryByText('Book b')).not.toBeInTheDocument();
  });

  it('draws nothing until there is something to carry on with', async () => {
    serve([reading('a', { isFinished: true })]);

    const { container } = renderInAnAddress(<ContinueReading onOpen={vi.fn()} />);

    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('opens the book chosen', async () => {
    const onOpen = vi.fn();

    serve([reading('a')]);

    renderInAnAddress(<ContinueReading onOpen={onOpen} />);

    await userEvent.click(await screen.findByText('Book a'));

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: IDS['a'] }));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ContinueReading.displayName).toBe('ContinueReading');
  });
});
