import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchBook, fetchReadingProgress } from '@ValenceClient/books/fetchBooks';
import { aBook } from '@ValenceMobile/testing/aBook';
import { aChapter } from '@ValenceMobile/testing/aChapter';
import { AReader } from './AReader';

jest.mock('@ValenceClient/books/fetchBooks', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchBooks'),
  fetchBook: jest.fn(),
  fetchReadingProgress: jest.fn(),
  saveReadingProgress: jest.fn(() => Promise.resolve(true)),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchReadingProgress).mockResolvedValue([]);
});

describe('AReader', () => {
  it('reads a book of pages in the page reader', async () => {
    jest.mocked(fetchBook).mockResolvedValue({
      book: aBook({ layout: 'fixed', title: 'One-Punch Man' }),
      chapters: [aChapter(1, { format: 'cbz', pageCount: 2 })],
    });
    const drawn = await render(
      <AReader bookId={aBook().id} chapterId={null} isFromTheStart={false} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('Page 1 of 2')).toBeTruthy();
  });

  it('says so where a book has nothing in it yet', async () => {
    jest.mocked(fetchBook).mockResolvedValue({ book: aBook(), chapters: [] });
    const drawn = await render(
      <AReader bookId={aBook().id} chapterId={null} isFromTheStart={false} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText(/Nothing in this book yet/u)).toBeTruthy();
  });
});
