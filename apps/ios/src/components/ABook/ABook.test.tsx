import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchBook, fetchReading, fetchReadingProgress } from '@ValenceClient/books/fetchBooks';
import { aBook } from '@ValencePhone/testing/aBook';
import { aChapter } from '@ValencePhone/testing/aChapter';
import { ABook } from './ABook';

jest.mock('@ValenceClient/books/fetchBooks', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchBooks'),
  fetchBook: jest.fn(),
  fetchReading: jest.fn(),
  fetchReadingProgress: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  installPlatform(aFakePlatform());
  jest.mocked(fetchReadingProgress).mockResolvedValue([]);
});

const aReading = (isFinished: boolean) => ({
  book: aBook(),
  chapterId: aChapter(1).id,
  chapterTitle: 'Chapter 1',
  pageNumber: null,
  pageCount: null,
  fraction: isFinished ? 1 : 0.42,
  isFinished,
  updatedAt: '2026-09-23T10:00:00.000Z',
});

describe('ABook', () => {
  it('shows the book and starts it where nobody has', async () => {
    jest.mocked(fetchBook).mockResolvedValue({ book: aBook(), chapters: [aChapter(1)] });
    jest.mocked(fetchReading).mockResolvedValue([]);
    const onRead = jest.fn();
    const drawn = await render(
      <ABook bookId={aBook().id} onRead={onRead} onListen={jest.fn()} onBack={jest.fn()} />,
      {
        wrapper: CacheScope,
      },
    );

    expect(await drawn.findByText('Dune')).toBeTruthy();
    expect(drawn.getByText('Frank Herbert · 1965')).toBeTruthy();

    await userEvent.press(drawn.getByText('Read'));

    expect(onRead).toHaveBeenCalledWith(aBook().id, null, false);
  });

  it('carries on where this profile stopped, saying how far that is', async () => {
    jest.mocked(fetchBook).mockResolvedValue({ book: aBook(), chapters: [aChapter(1)] });
    jest.mocked(fetchReading).mockResolvedValue([aReading(false)]);
    const drawn = await render(
      <ABook bookId={aBook().id} onRead={jest.fn()} onListen={jest.fn()} onBack={jest.fn()} />,
      {
        wrapper: CacheScope,
      },
    );

    expect(await drawn.findByText('Continue reading')).toBeTruthy();
    expect(drawn.getByText('42% read')).toBeTruthy();
  });

  it('starts a finished book again from its first page', async () => {
    jest.mocked(fetchBook).mockResolvedValue({ book: aBook(), chapters: [aChapter(1)] });
    jest.mocked(fetchReading).mockResolvedValue([aReading(true)]);
    const onRead = jest.fn();
    const drawn = await render(
      <ABook bookId={aBook().id} onRead={onRead} onListen={jest.fn()} onBack={jest.fn()} />,
      {
        wrapper: CacheScope,
      },
    );

    await userEvent.press(await drawn.findByText('Read again'));

    expect(onRead).toHaveBeenCalledWith(aBook().id, null, true);
  });

  it('lists the chapters of a series, each opening from its start', async () => {
    jest.mocked(fetchBook).mockResolvedValue({
      book: aBook({ chapterCount: 2 }),
      chapters: [aChapter(1), aChapter(2)],
    });
    jest.mocked(fetchReading).mockResolvedValue([]);
    const onRead = jest.fn();
    const drawn = await render(
      <ABook bookId={aBook().id} onRead={onRead} onListen={jest.fn()} onBack={jest.fn()} />,
      {
        wrapper: CacheScope,
      },
    );

    await userEvent.press(await drawn.findByRole('button', { name: 'Read Chapter 2' }));

    expect(onRead).toHaveBeenCalledWith(aBook().id, aChapter(2).id, false);
  });
});
