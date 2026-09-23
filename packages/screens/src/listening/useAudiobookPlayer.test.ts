import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAudiobookPlayer } from '@ValenceScreens/listening/useAudiobookPlayer';
import { tracksOf } from '@ValenceScreens/listening/tracksOf';
import { aFakeAudiobookPlayer } from '@ValenceScreens/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceScreens/testing/anAudiobook';

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
