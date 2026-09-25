import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchBook, fetchReading, fetchReadingProgress } from '@ValenceClient/books/fetchBooks';
import { fetchListening, fetchListeningProgress } from '@ValenceClient/books/fetchListening';
import { aListening } from '@ValenceClient/testing/aListening';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aFakeAudiobookPlayer } from '@ValenceMobile/testing/aFakeAudiobookPlayer';
import { aBook } from '@ValenceMobile/testing/aBook';
import { aChapter } from '@ValenceMobile/testing/aChapter';
import { ABook } from './ABook';

jest.mock('@ValenceClient/books/fetchBooks', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchBooks'),
  fetchBook: jest.fn(),
  fetchReading: jest.fn(),
  fetchReadingProgress: jest.fn(),
}));

jest.mock('@ValenceClient/books/fetchListening', () => ({
  ...jest.requireActual<object>('@ValenceClient/books/fetchListening'),
  fetchListening: jest.fn(),
  fetchListeningProgress: jest.fn(),
}));

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceMobile/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

beforeEach(() => {
  jest.clearAllMocks();
  installPlatform(aFakePlatform());
  jest.mocked(fetchReadingProgress).mockResolvedValue([]);
  jest.mocked(fetchListening).mockResolvedValue([]);
  jest.mocked(fetchListeningProgress).mockResolvedValue(null);
  mockFake = aFakeAudiobookPlayer();
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

  it('numbers each chapter and says how many pages it runs to, with how far into it', async () => {
    jest.mocked(fetchBook).mockResolvedValue({
      book: aBook({ chapterCount: 2 }),
      chapters: [aChapter(1, { pageCount: 20 }), aChapter(2, { pageCount: 1 })],
    });
    jest.mocked(fetchReading).mockResolvedValue([]);

    const drawn = await render(
      <ABook bookId={aBook().id} onRead={jest.fn()} onListen={jest.fn()} onBack={jest.fn()} />,
      {
        wrapper: CacheScope,
      },
    );

    expect(await drawn.findByText('1. Chapter 1')).toBeTruthy();
    expect(drawn.getByText('20 pages')).toBeTruthy();
    expect(drawn.getByText('1 page')).toBeTruthy();
  });

  describe('an audiobook', () => {
    beforeEach(() => {
      jest.mocked(fetchBook).mockResolvedValue(anAudiobook());
      jest.mocked(fetchReading).mockResolvedValue([]);
    });

    it('leads with listening where there is nothing to read, and says how long it lasts', async () => {
      const onListen = jest.fn();
      const drawn = await render(
        <ABook
          bookId={anAudiobook().book.id}
          onRead={jest.fn()}
          onListen={onListen}
          onBack={jest.fn()}
        />,
        { wrapper: CacheScope },
      );

      await userEvent.press(await drawn.findByRole('button', { name: 'Listen' }));

      expect(drawn.queryByRole('button', { name: 'Read' })).toBeNull();
      expect(drawn.getByText('Pierce Brown · 2014 · 20 min · 3 chapters')).toBeTruthy();
      expect(onListen).toHaveBeenCalled();
      expect(mockFake.player.read().book?.id).toBe(anAudiobook().book.id);
    });

    it('says where somebody is, and offers to carry on from there', async () => {
      jest.mocked(fetchListening).mockResolvedValue([aListening()]);
      jest.mocked(fetchListeningProgress).mockResolvedValue({
        bookId: anAudiobook().book.id,
        chapterId: anAudiobook().chapters[1]?.id ?? '',
        positionSeconds: 60,
        isFinished: false,
        updatedAt: '2026-09-23T00:00:00.000Z',
      });

      const drawn = await render(
        <ABook
          bookId={anAudiobook().book.id}
          onRead={jest.fn()}
          onListen={jest.fn()}
          onBack={jest.fn()}
        />,
        { wrapper: CacheScope },
      );

      expect(await drawn.findByRole('button', { name: 'Continue listening' })).toBeTruthy();
      expect(await drawn.findByText('Part 2 · 9 min left')).toBeTruthy();
    });

    it('lists its chapters, and starts the book at the one chosen', async () => {
      const onListen = jest.fn();
      const drawn = await render(
        <ABook
          bookId={anAudiobook().book.id}
          onRead={jest.fn()}
          onListen={onListen}
          onBack={jest.fn()}
        />,
        { wrapper: CacheScope },
      );

      await userEvent.press(await drawn.findByRole('button', { name: 'Listen from The Passage' }));

      expect(drawn.getByText('Chapters')).toBeTruthy();
      expect(onListen).toHaveBeenCalled();
      expect(mockFake.player.read().bookPositionSeconds).toBe(900);
    });
  });
});
