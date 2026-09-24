import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { useChapterPlaying } from '@ValenceClient/books/useChapterPlaying';
import { aFakeAudiobookPlayer } from '@ValenceClient/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';

describe('useChapterPlaying', () => {
  it('draws again as a new chapter begins, and not as the book only moves on', () => {
    const { player, audio } = aFakeAudiobookPlayer();
    const { book, chapters } = anAudiobook();
    let draws = 0;
    const { result } = renderHook(() => {
      draws += 1;

      return useChapterPlaying(player);
    });

    expect(result.current).toBe(-1);

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
      player.goToChapter(2);
    });

    expect(result.current).toBe(2);
  });
});
