import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchBooks, fetchReading } from '@ValenceClient/books/fetchBooks';
import { fetchListening } from '@ValenceClient/books/fetchListening';
import { aListening } from '@ValenceClient/testing/aListening';
import { aBook } from '@ValencePhone/testing/aBook';
import { TheBooks } from './TheBooks';

jest.mock('@ValenceClient/books/fetchBooks', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchBooks'),
  fetchBooks: jest.fn(),
  fetchReading: jest.fn(),
}));

jest.mock('@ValenceClient/books/fetchListening', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchListening'),
  fetchListening: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchListening).mockResolvedValue([]);
});

describe('TheBooks', () => {
  it('carries on with what is being read, and opens any book', async () => {
    jest
      .mocked(fetchBooks)
      .mockResolvedValue([
        aBook(),
        aBook({ id: '00000000-0000-4000-8000-0000000000b9', title: 'Emma' }),
      ]);
    jest.mocked(fetchReading).mockResolvedValue([
      {
        book: aBook(),
        chapterId: '00000000-0000-4000-8000-0000000000c1',
        chapterTitle: 'Chapter 1',
        pageNumber: null,
        pageCount: null,
        fraction: 0.5,
        isFinished: false,
        updatedAt: '2026-09-23T10:00:00.000Z',
      },
    ]);
    const onRead = jest.fn();
    const onBook = jest.fn();
    const drawn = await render(
      <TheBooks
        header={null}
        libraryIds={['books']}
        onBook={onBook}
        onRead={onRead}
        onListen={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(await drawn.findByRole('button', { name: 'Carry on reading Dune' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Emma' }));

    expect(onRead).toHaveBeenCalledWith(aBook().id);
    expect(onBook).toHaveBeenCalledWith('00000000-0000-4000-8000-0000000000b9');
  });

  it('says there are no books yet in an empty library', async () => {
    jest.mocked(fetchBooks).mockResolvedValue([]);
    jest.mocked(fetchReading).mockResolvedValue([]);
    const drawn = await render(
      <TheBooks
        header={null}
        libraryIds={['books']}
        onBook={jest.fn()}
        onRead={jest.fn()}
        onListen={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('No books yet')).toBeTruthy();
  });

  it('carries on with what is being listened to, saying the chapter and what is left', async () => {
    jest.mocked(fetchBooks).mockResolvedValue([]);
    jest.mocked(fetchReading).mockResolvedValue([]);
    jest.mocked(fetchListening).mockResolvedValue([aListening(), aListening({ isFinished: true })]);
    const onListen = jest.fn();
    const drawn = await render(
      <TheBooks
        header={null}
        libraryIds={['books']}
        onBook={jest.fn()}
        onRead={jest.fn()}
        onListen={onListen}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(
      await drawn.findByRole('button', { name: 'Carry on listening to Red Rising' }),
    );

    expect(drawn.getByText('Continue listening')).toBeTruthy();
    expect(drawn.getByText('Part 2 · 9 min left')).toBeTruthy();
    expect(onListen).toHaveBeenCalledWith(aListening().book.id);
  });
});
