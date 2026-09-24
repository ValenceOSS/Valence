import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAudiobookPlayer } from '@ValenceClient/books/useAudiobookPlayer';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { aFakeAudiobookPlayer } from '@ValenceClient/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';

describe('useAudiobookPlayer', () => {
  it('draws again as the player changes', () => {
    const { player } = aFakeAudiobookPlayer();
    const { book, chapters } = anAudiobook();
    const { result } = renderHook(() => useAudiobookPlayer(player));

    expect(result.current.state.book).toBeNull();

    act(() => {
      player.open(book, tracksOf(chapters), null);
    });

    expect(result.current.state.book?.title).toBe('Red Rising');
    expect(result.current.player).toBe(player);
  });
});

describe('useAudiobookPlayer, not following the position', () => {
  it('draws nothing again as the book only moves on', () => {
    const { player, audio } = aFakeAudiobookPlayer();
    const { book, chapters } = anAudiobook();
    let draws = 0;
    const { result } = renderHook(() => {
      draws += 1;

      return useAudiobookPlayer(player, { followsPosition: false });
    });

    act(() => {
      player.open(book, tracksOf(chapters), null);
      audio.fire('loadedmetadata');
    });

    const drawn = draws;

    act(() => {
      audio.currentTime = 30;
      audio.fire('timeupdate');
    });

    expect(draws).toBe(drawn);

    act(() => {
      player.pause();
      audio.fire('pause');
    });

    expect(result.current.state.isPlaying).toBe(false);
  });
});
