import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { aListening } from '@ValenceClient/testing/aListening';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { BookPage } from '@ValenceTv/screens/BookPage/BookPage';
import { aFakeAudiobookPlayer } from '@ValenceTv/testing/aFakeAudiobookPlayer';
import type { BookDetail, ListeningProgress } from '@ValenceContracts/schemas/Book';

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceClient/books/theAudiobookPlayer', () => ({
  theAudiobookPlayer: () => mockFake.player,
}));

const detail = anAudiobook();

const PLACE: ListeningProgress = {
  bookId: detail.book.id,
  chapterId: detail.chapters[0]?.id ?? '',
  positionSeconds: 60,
  isFinished: false,
  updatedAt: '2026-09-24T00:00:00.000Z',
};

type Seed = { found?: BookDetail | null; place?: ListeningProgress | null };

const draw = async ({ found = detail, place = null }: Seed = {}) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  const onListen = jest.fn();

  cache.setQueryData(bookQueries.one(detail.book.id).queryKey, found);
  cache.setQueryData(bookQueries.listeningPlace(detail.book.id).queryKey, place);
  cache.setQueryData(
    bookQueries.listening().queryKey,
    place === null ? [] : [aListening({ chapterId: place.chapterId })],
  );

  const drawn = await render(
    <QueryClientProvider client={cache}>
      <BookPage bookId={detail.book.id} onListen={onListen} />
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

  return { drawn, onListen };
};

beforeEach(() => {
  mockFake = aFakeAudiobookPlayer();
});

describe('BookPage', () => {
  it('says what the book is, how long it lasts and how many chapters it has', async () => {
    const { drawn } = await draw();

    expect(drawn.getByText('Red Rising')).toBeTruthy();
    expect(drawn.getByText('Pierce Brown')).toBeTruthy();
    expect(drawn.getByText('2014   ·   20 min   ·   3 chapters')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'The Institute, 5 min' })).toBeTruthy();
  });

  it('starts a book nobody has started from the beginning, and shows the player', async () => {
    const { drawn, onListen } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'Listen' }));

    await waitFor(() => {
      expect(onListen).toHaveBeenCalled();
    });
    expect(mockFake.player.read().book?.id).toBe(detail.book.id);
    expect(mockFake.player.read().bookPositionSeconds).toBe(0);
    expect(drawn.queryByRole('button', { name: 'Start again' })).toBeNull();
  });

  it('carries on from where somebody left off, or starts again', async () => {
    const { drawn, onListen } = await draw({ place: PLACE });

    expect(
      drawn.getByText('2014   ·   20 min   ·   3 chapters   ·   Part 2 · 9 min left'),
    ).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Start again' }));

    expect(onListen).toHaveBeenCalled();
    expect(mockFake.player.read().bookPositionSeconds).toBe(0);
    expect(drawn.getByRole('button', { name: 'Continue listening' })).toBeTruthy();
  });

  it('starts the book at a chapter chosen from the list, and shows the player', async () => {
    const { drawn, onListen } = await draw();

    await userEvent.press(drawn.getByRole('button', { name: 'The Passage, 5 min' }));

    expect(onListen).toHaveBeenCalled();
    expect(mockFake.player.read().bookPositionSeconds).toBe(900);
  });

  it('says so where the book has nothing to listen to', async () => {
    const { drawn } = await draw({ found: { ...detail, chapters: [] } });

    expect(drawn.getByText('This book has nothing to listen to.')).toBeTruthy();
  });
});
