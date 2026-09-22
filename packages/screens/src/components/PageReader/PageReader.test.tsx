import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { PageReader } from './PageReader';
import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';
import { alwaysReachable } from '@ValenceClient/platform/alwaysReachable';
import { noFilesAreKept } from '@ValenceClient/platform/noFilesAreKept';

const held = new Map<string, string>();

const A_BOOK: Book = {
  id: 'a-book',
  libraryId: 'a-library',
  title: 'Rent-A-Girlfriend',
  layout: 'fixed',
  direction: 'rightToLeft',
  year: 2020,
  overview: null,
  genres: null,
  authors: null,
  rating: null,
  posterUrl: null,
  hasCover: true,
  chapterCount: 2,
  addedAt: '2026-08-20T00:00:00.000Z',
  updatedAt: '2026-08-20T00:00:00.000Z',
};

const CHAPTERS: BookChapter[] = [
  {
    id: 'one',
    bookId: 'a-book',
    number: 1,
    title: 'Volume 1',
    format: 'cbz',
    pageCount: 10,
    addedAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'two',
    bookId: 'a-book',
    number: 2,
    title: 'Volume 2',
    format: 'cbz',
    pageCount: 10,
    addedAt: '2026-08-20T00:00:00.000Z',
  },
];

const draw = (overrides: Partial<Parameters<typeof PageReader>[0]> = {}) =>
  render(
    <PageReader
      book={A_BOOK}
      chapters={CHAPTERS}
      chapterId="one"
      onChapterChange={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  );

const shown = (): string => screen.getByRole('img', { name: /^Page/ }).getAttribute('alt') ?? '';

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 600 });
  forgetPlatform();
  held.clear();
  installPlatform({
    store: {
      read: (key) => held.get(key) ?? null,
      write: (key, value) => {
        held.set(key, value);
      },
      forget: (key) => {
        held.delete(key);
      },
    },
    describeThisClient: () => 'Valence',
    thisClientKind: () => 'browser',
    canKeepFiles: () => true,
    held: noFilesAreKept(),
    reachability: alwaysReachable(),
    thisClientId: () => 'a-client',
    openSocket: () => ({ send: () => {}, close: () => {} }),
    buildInfo: () => null,
  });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight');
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth');
  forgetPlatform();
});

describe('PageReader', () => {
  it('opens on the first page of a chapter', () => {
    draw();

    expect(shown()).toBe('Page 1');
  });

  it('opens where somebody left off', () => {
    draw({ startAtPage: 5 });

    expect(shown()).toBe('Page 6');
  });

  it('turns forward on the left arrow, because manga is read right to left', async () => {
    draw();

    await userEvent.keyboard('{ArrowLeft}');

    expect(shown()).toBe('Page 2');
  });

  it('turns back on the right arrow, for the same reason', async () => {
    draw({ startAtPage: 4 });

    await userEvent.keyboard('{ArrowRight}');

    expect(shown()).toBe('Page 4');
  });

  it('turns forward on the right arrow for a book read left to right', async () => {
    draw({ book: { ...A_BOOK, direction: 'leftToRight' } });

    await userEvent.keyboard('{ArrowRight}');

    expect(shown()).toBe('Page 2');
  });

  it('turns forward on the space bar, whichever way the book is read', async () => {
    draw();

    await userEvent.keyboard(' ');

    expect(shown()).toBe('Page 2');
  });

  it('will not turn back past the first page of the first chapter', async () => {
    draw();

    await userEvent.keyboard('{ArrowRight}');

    expect(shown()).toBe('Page 1');
  });

  it('moves to the next chapter when turning past the end', async () => {
    const onChapterChange = vi.fn();

    draw({ startAtPage: 9, onChapterChange });

    await userEvent.keyboard('{ArrowLeft}');

    expect(onChapterChange).toHaveBeenCalledWith('two');
  });

  it('moves to the chapter before when turning back off the front of one', async () => {
    const onChapterChange = vi.fn();

    draw({ chapterId: 'two', onChapterChange });

    await userEvent.keyboard('{ArrowRight}');

    expect(onChapterChange).toHaveBeenCalledWith('one');
  });

  it('says where somebody is up to, so it can be remembered', async () => {
    const onPageChange = vi.fn();

    draw({ onPageChange });
    onPageChange.mockClear();

    await userEvent.keyboard('{ArrowLeft}');

    expect(onPageChange).toHaveBeenCalledWith(1, false);
  });

  it('says when the last page was reached', () => {
    const onPageChange = vi.fn();

    draw({ startAtPage: 9, onPageChange });

    expect(onPageChange).toHaveBeenCalledWith(9, true);
  });

  it('leaves on escape', async () => {
    const onClose = vi.fn();

    draw({ onClose });

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('asks for a page at the width it will be drawn, not at full size', () => {
    draw();

    expect(screen.getByRole('img', { name: 'Page 1' }).getAttribute('src')).toContain('width=');
  });

  it('remembers how somebody likes to read, on the device', async () => {
    draw();

    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Two' }));

    expect(held.get('valence.reader')).toContain('"isDouble":true');
  });

  it('does not zoom the page when it is double clicked', async () => {
    draw();

    const page = screen.getByRole('img', { name: 'Page 1' });

    await userEvent.dblClick(page);

    expect(page.closest<HTMLElement>('[style*="translate3d"]')?.style.transform).toContain(
      'scale(1)',
    );
  });

  it('offers a gap between the two pages of a spread only while two are showing', async () => {
    draw();

    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));

    expect(screen.queryByRole('slider', { name: 'Gap between pages' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Two' }));

    expect(screen.getByRole('slider', { name: 'Gap between pages' })).toBeInTheDocument();
  });

  it('remembers whether turning a page is animated', async () => {
    draw();

    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Animate turning pages' }));

    expect(held.get('valence.reader')).toContain('"isAnimated":false');
  });

  it('lays the chapter down as one strip to scroll, and remembers that', async () => {
    draw();

    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Scroll' }));

    expect(screen.getByRole('img', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /^Page \d+$/ }).length).toBeLessThanOrEqual(10);
    expect(held.get('valence.reader')).toContain('"isScrolling":true');
  });

  it('offers the way on to the next chapter at the foot of the strip', async () => {
    const onChapterChange = vi.fn();

    draw({ onChapterChange });

    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Scroll' }));
    const strip = screen
      .getByRole('img', { name: 'Page 1' })
      .closest<HTMLElement>('[role="presentation"]');

    if (strip === null) {
      throw new Error('The strip was not drawn.');
    }

    await userEvent.click(within(strip).getByRole('button', { name: 'Next chapter' }));

    expect(onChapterChange).toHaveBeenCalledWith('two');
  });

  it('says in the panel which book, which chapter and which page', async () => {
    draw();

    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));

    const panel = screen.getByRole('complementary', { name: 'Reading' });

    expect(within(panel).getByText('Rent-A-Girlfriend')).toBeInTheDocument();
    expect(within(panel).getAllByText('Volume 1').length).toBeGreaterThan(0);
    expect(within(panel).getByRole('button', { name: 'Page' })).toHaveTextContent('1');
  });

  it('steps to the next chapter from the panel', async () => {
    const onChapterChange = vi.fn();

    draw({ onChapterChange });

    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next chapter' }));

    expect(onChapterChange).toHaveBeenCalledWith('two');
  });

  it('offers the cover on its own only when pages are shown two at a time', async () => {
    draw();

    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));

    expect(screen.queryByRole('switch', { name: 'Cover on its own' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Two' }));

    expect(screen.getByRole('switch', { name: 'Cover on its own' })).toBeInTheDocument();
  });

  it('keeps the panel open next time where somebody pinned it', async () => {
    draw();

    await userEvent.click(screen.getByRole('button', { name: 'Bring out the panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Keep the panel beside the page' }));

    expect(held.get('valence.reader.panel')).toBe('pinned');
  });
});
