import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, userEvent } from '@testing-library/react-native';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { aListening } from '@ValenceClient/testing/aListening';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { Books } from '@ValenceTv/screens/Books/Books';
import type { Book, BookListening } from '@ValenceContracts/schemas/Book';

const { book } = anAudiobook();

const GOLDEN_SON: Book = {
  ...book,
  id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b0c',
  title: 'Golden Son',
};

const LIBRARY = 'books';

type Seed = { books?: Book[] | null; listening?: BookListening[] };

const draw = async (seed: Seed = {}) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  const onOpen = jest.fn();
  const onFeature = jest.fn();

  if (seed.books !== null) {
    cache.setQueryData(bookQueries.inLibrary(LIBRARY).queryKey, seed.books ?? [book, GOLDEN_SON]);
  }

  cache.setQueryData(bookQueries.listening().queryKey, seed.listening ?? []);

  const drawn = await render(
    <QueryClientProvider client={cache}>
      <Books libraryIds={[LIBRARY]} onOpen={onOpen} onFeature={onFeature} upTo={null} />
    </QueryClientProvider>,
  );

  const [page] = drawn.container.queryAll(
    (node) => node.type === 'View' && typeof node.props.onLayout === 'function',
  );

  if (page !== undefined) {
    await fireEvent(page, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 1920, height: 1080 } },
    });
  }

  return { drawn, onOpen, onFeature };
};

describe('Books', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn(() => new Promise<Response>(() => undefined));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('waits while the books are read', async () => {
    const { drawn } = await draw({ books: null });

    expect(drawn.container.queryAll((node) => node.type === 'ActivityIndicator')).toHaveLength(1);
  });

  it('says so when there is nothing to listen to', async () => {
    const { drawn } = await draw({ books: [{ ...book, hasAudio: false }] });

    expect(drawn.getByText('There are no audiobooks here yet.')).toBeTruthy();
  });

  it('lists every audiobook by title, naming the first large, lit by its cover', async () => {
    const { drawn, onFeature } = await draw();

    expect(drawn.getByText('Every audiobook')).toBeTruthy();
    expect(drawn.getAllByText('Golden Son')).toHaveLength(2);
    expect(onFeature).toHaveBeenLastCalledWith(`/api/books/${GOLDEN_SON.id}/cover`);
    expect(drawn.queryByText('Continue listening')).toBeNull();
  });

  it('puts the books somebody is partway through first, saying where they are', async () => {
    const { drawn } = await draw({ listening: [aListening()] });

    expect(drawn.getByText('Continue listening')).toBeTruthy();
    expect(drawn.getByText('Part 2 · 9 min left')).toBeTruthy();
    expect(drawn.getAllByText('Red Rising')).toHaveLength(3);
  });

  it('lights the page with the book the remote rests on', async () => {
    const { drawn, onFeature } = await draw();

    const [first] = drawn.getAllByRole('button', { name: 'Red Rising' });

    if (first === undefined) {
      throw new Error('Red Rising is not on the page');
    }

    await fireEvent(first, 'focus');
    await act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onFeature).toHaveBeenLastCalledWith(`/api/books/${book.id}/cover`);
  });

  it('hands back the book chosen', async () => {
    jest.useRealTimers();

    const { drawn, onOpen } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Golden Son' }));

    expect(onOpen).toHaveBeenCalledWith(GOLDEN_SON);
  });
});
