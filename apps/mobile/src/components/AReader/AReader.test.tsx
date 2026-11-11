import { act, render, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchBook, fetchReadingProgress } from '@ValenceClient/books/fetchBooks';
import { useBookmarks } from '@ValenceClient/books/useBookmarks';
import { aBook } from '@ValenceMobile/testing/aBook';
import { aBookmark } from '@ValenceMobile/testing/aBookmark';
import { aChapter } from '@ValenceMobile/testing/aChapter';
import { APageReader } from '@ValenceMobile/components/AReader/components/APageReader/APageReader';
import { ATextReader } from '@ValenceMobile/components/AReader/components/ATextReader/ATextReader';
import { AReader } from './AReader';

jest.mock('@ValenceClient/books/fetchBooks', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchBooks'),
  fetchBook: jest.fn(),
  fetchReadingProgress: jest.fn(),
  saveReadingProgress: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@ValenceClient/books/useBookmarks', () => ({
  useBookmarks: jest.fn(),
}));

jest.mock('@ValenceMobile/components/AReader/components/APageReader/APageReader', () => {
  const actual = jest.requireActual<{ APageReader: () => null }>(
    '@ValenceMobile/components/AReader/components/APageReader/APageReader',
  );

  return { APageReader: jest.fn(actual.APageReader) };
});

jest.mock('@ValenceMobile/components/AReader/components/ATextReader/ATextReader', () => ({
  ATextReader: jest.fn(() => null),
}));

const FIRST = aChapter(1, { format: 'cbz', pageCount: 4 });

const SECOND = aChapter(2, { format: 'cbz', pageCount: 4 });

const ON_PAGE_TWO = aBookmark('2', { chapterId: SECOND.id, pageNumber: 1 });

const IN_THE_FIRST = aBookmark('3', { chapterId: FIRST.id, pageNumber: 3 });

const marked = { add: jest.fn(), remove: jest.fn() };

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchReadingProgress).mockResolvedValue([]);
  jest.mocked(useBookmarks).mockReturnValue({ bookmarks: [], ...marked });
  jest.mocked(APageReader).mockClear();
  jest.mocked(ATextReader).mockClear();
  marked.add.mockClear();
  marked.remove.mockClear();
});

/**
 * What the reader last handed the page reader it opened.
 *
 * @returns Its props.
 */
const thePages = () => {
  const props = jest.mocked(APageReader).mock.lastCall?.[0];

  if (props === undefined) {
    throw new Error('No page reader was opened.');
  }

  return props;
};

/**
 * What the reader last handed the text reader it opened.
 *
 * @returns Its props.
 */
const theText = () => {
  const props = jest.mocked(ATextReader).mock.lastCall?.[0];

  if (props === undefined) {
    throw new Error('No text reader was opened.');
  }

  return props;
};

/**
 * Opens the book on the phone.
 */
const open = () =>
  render(
    <AReader bookId={aBook().id} chapterId={null} isFromTheStart={false} onBack={jest.fn()} />,
    { wrapper: CacheScope },
  );

describe('AReader', () => {
  it('reads a book of pages in the page reader', async () => {
    jest.mocked(fetchBook).mockResolvedValue({
      book: aBook({ layout: 'fixed', title: 'One-Punch Man' }),
      chapters: [aChapter(1, { format: 'cbz', pageCount: 2 })],
    });
    const drawn = await open();

    expect(await drawn.findByText('Page 1 of 2')).toBeTruthy();
  });

  it('says so where a book has nothing in it yet', async () => {
    jest.mocked(fetchBook).mockResolvedValue({ book: aBook(), chapters: [] });
    const drawn = await open();

    expect(await drawn.findByText(/No content found for this book/u)).toBeTruthy();
  });

  it('keeps the bookmarks of every chapter, handing the reader the ones in the chapter open', async () => {
    jest.mocked(useBookmarks).mockReturnValue({
      bookmarks: [IN_THE_FIRST, ON_PAGE_TWO],
      ...marked,
    });
    jest.mocked(fetchBook).mockResolvedValue({
      book: aBook({ layout: 'fixed' }),
      chapters: [FIRST, SECOND],
    });
    const drawn = await open();

    await drawn.findByText('Page 1 of 4');

    expect(jest.mocked(useBookmarks)).toHaveBeenLastCalledWith(aBook().id, [FIRST.id, SECOND.id]);
    expect(thePages().marks?.here).toEqual([IN_THE_FIRST]);
    expect(thePages().marks?.all.map((one) => [one.place, one.chapter])).toEqual([
      ['Page 4', 'Chapter 1'],
      ['Page 2', 'Chapter 2'],
    ]);
    expect(thePages().marks?.all[1]?.picture).toMatch(
      new RegExp(`/api/books/.+/chapters/${SECOND.id}/pages/1\\?width=160$`, 'u'),
    );

    await act(() => {
      thePages().marks?.onMark({
        pageNumber: 2,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      });
    });

    expect(marked.add).toHaveBeenCalledWith({
      chapterId: FIRST.id,
      pageNumber: 2,
      fraction: null,
      pageShown: null,
      excerpt: null,
      picture: null,
    });

    await act(() => {
      thePages().marks?.onUnmark([IN_THE_FIRST.id]);
    });

    expect(marked.remove).toHaveBeenCalledWith([IN_THE_FIRST.id]);
  });

  it('opens a bookmark in another chapter at its page, and forgets it on moving chapter', async () => {
    jest.mocked(useBookmarks).mockReturnValue({ bookmarks: [ON_PAGE_TWO], ...marked });
    jest.mocked(fetchBook).mockResolvedValue({
      book: aBook({ layout: 'fixed' }),
      chapters: [FIRST, SECOND],
    });
    const drawn = await open();

    await drawn.findByText('Page 1 of 4');

    await act(() => {
      thePages().marks?.onOpen(ON_PAGE_TWO.id);
    });

    expect(thePages()).toMatchObject({ chapterId: SECOND.id, startAtPage: 1 });
    expect(await drawn.findByText('Page 2 of 4')).toBeTruthy();

    await act(() => {
      thePages().onChapter(FIRST.id);
    });
    await act(() => {
      thePages().onChapter(SECOND.id);
    });

    expect(thePages()).toMatchObject({ chapterId: SECOND.id, startAtPage: 0 });
  });

  it('opens a bookmark in a book of text at its place', async () => {
    const atAPlace = aBookmark('4', { chapterId: FIRST.id, fraction: 0.4 });

    jest.mocked(useBookmarks).mockReturnValue({ bookmarks: [atAPlace], ...marked });
    jest.mocked(fetchBook).mockResolvedValue({
      book: aBook({ layout: 'reflow' }),
      chapters: [aChapter(1)],
    });
    await open();

    await waitFor(() => {
      expect(jest.mocked(ATextReader)).toHaveBeenCalled();
    });

    expect(theText().startAtFraction).toBe(0);

    await act(() => {
      theText().marks?.onOpen(atAPlace.id);
    });

    expect(theText().startAtFraction).toBe(0.4);
  });
});
