import { act, renderHook } from '@testing-library/react-native';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { useTheBook } from '@ValenceMobile/hooks/useTheBook';
import { aFakeAudiobookPlayer } from '@ValenceMobile/testing/aFakeAudiobookPlayer';

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceMobile/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

beforeEach(() => {
  mockFake = aFakeAudiobookPlayer();
});

describe('useTheBook', () => {
  it('reads the phone’s audiobook player, drawing again as it changes', async () => {
    const { result } = await renderHook(() => useTheBook());
    const { book, chapters } = anAudiobook();

    expect(result.current.state.book).toBeNull();

    await act(() => {
      mockFake.player.open(book, tracksOf(chapters), null);
    });

    expect(result.current.state.book?.title).toBe('Red Rising');
    expect(result.current.player).toBe(mockFake.player);
  });

  it('follows where the book has got to only where asked', async () => {
    const { book, chapters } = anAudiobook();

    mockFake.player.open(book, tracksOf(chapters), null);
    mockFake.audio.fire('loadedmetadata');

    const still = await renderHook(() => useTheBook());
    const moving = await renderHook(() => useTheBook({ followsPosition: true }));

    await act(() => {
      mockFake.audio.currentTime = 42;
      mockFake.audio.fire('timeupdate');
    });

    expect(still.result.current.state.bookPositionSeconds).toBe(0);
    expect(moving.result.current.state.bookPositionSeconds).toBe(42);
  });
});
