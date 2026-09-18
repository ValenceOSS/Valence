import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { TextReader } from './TextReader';
import type { Book } from '@ValenceContracts/schemas/Book';

const held = new Map<string, string>();

const A_BOOK: Book = {
  id: 'a-book',
  libraryId: 'a-library',
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

const CONTENTS = {
  parts: [{ size: 100 }, { size: 300 }],
  contents: [
    { title: 'Chapter I.', part: 0, anchor: null, depth: 0 },
    { title: 'Chapter II.', part: 1, anchor: 'c2', depth: 0 },
  ],
};

const PARTS: Record<string, string> = {
  '0': '<h2>Chapter I.</h2><p>It is a truth universally acknowledged.</p><p><a href="#valence-part-1:c2">Onwards</a></p>',
  '1': '<h2 id="c2">Chapter II.</h2><p>Mr. Bennet was among the earliest.</p>',
};

class AScreenOfPaper implements ResizeObserver {
  private readonly told: ResizeObserverCallback;

  public constructor(told: ResizeObserverCallback) {
    this.told = told;
  }

  public observe(target: Element): void {
    const rect = {
      x: 0,
      y: 0,
      width: 600,
      height: 800,
      top: 0,
      left: 0,
      right: 600,
      bottom: 800,
      toJSON: () => ({}),
    };

    this.told(
      [
        {
          target,
          contentRect: rect,
          borderBoxSize: [{ inlineSize: 600, blockSize: 800 }],
          contentBoxSize: [{ inlineSize: 600, blockSize: 800 }],
          devicePixelContentBoxSize: [{ inlineSize: 600, blockSize: 800 }],
        },
      ],
      this,
    );
  }

  public unobserve(): void {
    return undefined;
  }

  public disconnect(): void {
    return undefined;
  }
}

/**
 * Answers the reader's questions about the book.
 */
const answer = (contents: object | null = CONTENTS) =>
  vi.fn((input: string) => {
    if (input.endsWith('/contents')) {
      return Promise.resolve(
        contents === null
          ? new Response('{}', { status: 404 })
          : new Response(JSON.stringify(contents), { status: 200 }),
      );
    }

    const part = /part=(\d+)/.exec(input)?.[1] ?? '';
    const html = PARTS[part];

    return Promise.resolve(
      html === undefined
        ? new Response('{}', { status: 404 })
        : new Response(html, { status: 200 }),
    );
  });

/**
 * Opens the reader on the book.
 */
const open = (overrides: Partial<Parameters<typeof TextReader>[0]> = {}) => {
  const handlers = { onPlaceChange: vi.fn(), onClose: vi.fn() };

  renderInAnAddress(
    <TextReader book={A_BOOK} chapterId="a-chapter" {...handlers} {...overrides} />,
  );

  return handlers;
};

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
  vi.stubGlobal('fetch', answer());
  vi.stubGlobal('ResizeObserver', AScreenOfPaper);
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('TextReader', () => {
  it('opens a book at its start', async () => {
    open();

    expect(await screen.findByText('It is a truth universally acknowledged.')).toBeInTheDocument();
  });

  it('opens where somebody left off, weighing the parts by how much they hold', async () => {
    open({ startAt: 0.5 });

    expect(await screen.findByText('Mr. Bennet was among the earliest.')).toBeInTheDocument();
  });

  it('turns on into the next part at the end of this one', async () => {
    open();

    await screen.findByText('It is a truth universally acknowledged.');
    await userEvent.keyboard('{ArrowRight}');

    expect(await screen.findByText('Mr. Bennet was among the earliest.')).toBeInTheDocument();
  });

  it('turns back into the part before from the start of this one', async () => {
    open({ startAt: 0.5 });

    await screen.findByText('Mr. Bennet was among the earliest.');
    await userEvent.keyboard('{ArrowLeft}');

    expect(await screen.findByText('It is a truth universally acknowledged.')).toBeInTheDocument();
  });

  it('says how far through the whole book somebody is, for remembering', async () => {
    const { onPlaceChange } = open();

    await screen.findByText('It is a truth universally acknowledged.');
    await userEvent.keyboard('{ArrowRight}');

    await waitFor(() => {
      expect(onPlaceChange).toHaveBeenLastCalledWith(0.25, true);
    });
  });

  it('follows a link to another place in the book', async () => {
    open();

    await userEvent.click(await screen.findByRole('link', { name: 'Onwards' }));

    expect(await screen.findByText('Mr. Bennet was among the earliest.')).toBeInTheDocument();
  });

  it('goes to a chapter chosen from the contents', async () => {
    open();

    await screen.findByText('It is a truth universally acknowledged.');
    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next chapter' }));

    expect(await screen.findByText('Mr. Bennet was among the earliest.')).toBeInTheDocument();
  });

  it('names the chapter being read in the title', async () => {
    open();

    await screen.findByText('It is a truth universally acknowledged.');

    expect(screen.getByText('Pride and Prejudice — Chapter I.')).toBeInTheDocument();
  });

  it('remembers how somebody likes text set, on the device', async () => {
    open();

    await screen.findByText('It is a truth universally acknowledged.');
    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sepia' }));

    expect(held.get('valence.reader.text')).toContain('"page":"sepia"');
  });

  it('leaves on escape', async () => {
    const { onClose } = open();

    await screen.findByText('It is a truth universally acknowledged.');
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('says so when a book cannot be opened as one that reflows', async () => {
    vi.stubGlobal('fetch', answer(null));

    open();

    expect(await screen.findByText('This book could not be opened')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TextReader.displayName).toBe('TextReader');
  });
});
