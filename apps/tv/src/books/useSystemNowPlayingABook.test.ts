import { act, renderHook } from '@testing-library/react-native';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { useSystemNowPlayingABook } from '@ValenceTv/books/useSystemNowPlayingABook';
import { aFakeAudiobookPlayer } from '@ValenceTv/testing/aFakeAudiobookPlayer';

const mockShow = jest.fn();

const mockUpdate = jest.fn();

const mockClear = jest.fn();

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceClient/books/theAudiobookPlayer', () => ({
  theAudiobookPlayer: () => mockFake.player,
}));

jest.mock('@ValenceTv/books/theTvsListeningAudio', () => ({
  theTvsListeningPlayer: () => ({
    setActiveForLockScreen: (...told: object[]) => {
      mockShow(...told);
    },
    updateLockScreenMetadata: (...told: object[]) => {
      mockUpdate(...told);
    },
    clearLockScreenControls: () => {
      mockClear();
    },
  }),
}));

const openTheBook = (): void => {
  const { book, chapters } = anAudiobook();

  mockFake.player.open(book, tracksOf(chapters), null);
  mockFake.audio.fire('loadedmetadata');
};

beforeEach(() => {
  mockFake = aFakeAudiobookPlayer();
  mockShow.mockClear();
  mockUpdate.mockClear();
  mockClear.mockClear();
});

describe('useSystemNowPlayingABook', () => {
  it('tells the television the chapter, who wrote it and the book', async () => {
    openTheBook();

    await renderHook(() => {
      useSystemNowPlayingABook(true);
    });

    expect(mockShow).toHaveBeenCalledWith(
      true,
      { title: 'Part 1', artist: 'Pierce Brown', albumTitle: 'Red Rising' },
      { showSeekBackward: true, showSeekForward: true },
    );
  });

  it('tells it again as the next chapter begins, and not as the book only plays on', async () => {
    openTheBook();

    await renderHook(() => {
      useSystemNowPlayingABook(true);
    });

    await act(async () => {
      mockFake.audio.currentTime = 30;
      mockFake.audio.fire('timeupdate');
      await Promise.resolve();
    });

    expect(mockUpdate).not.toHaveBeenCalled();

    await act(async () => {
      mockFake.player.goToChapter(2);
      mockFake.audio.fire('loadedmetadata');
      await Promise.resolve();
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'The Passage', albumTitle: 'Red Rising' }),
    );
  });

  it('shows nothing while the music is the one being heard', async () => {
    openTheBook();

    await renderHook(() => {
      useSystemNowPlayingABook(false);
    });

    expect(mockShow).not.toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
  });

  it('shows nothing while no book is open', async () => {
    await renderHook(() => {
      useSystemNowPlayingABook(true);
    });

    expect(mockShow).not.toHaveBeenCalled();
  });
});
