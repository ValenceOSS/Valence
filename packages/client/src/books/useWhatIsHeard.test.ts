import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { heardLast } from '@ValenceClient/books/heardLast';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { useWhatIsHeard } from '@ValenceClient/books/useWhatIsHeard';
import { aFakeAudiobookPlayer } from '@ValenceClient/testing/aFakeAudiobookPlayer';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { aTrack } from '@ValenceClient/testing/aTrack';

afterEach(() => {
  heardLast.forget();
});

describe('useWhatIsHeard', () => {
  it('hears nothing where neither has anything to play', () => {
    const { result } = renderHook(() =>
      useWhatIsHeard(aFakeAudiobookPlayer().player, aFakeMusicPlayer().player),
    );

    expect(result.current).toBeNull();
  });

  it('hears whichever is playing', () => {
    const book = aFakeAudiobookPlayer();
    const music = aFakeMusicPlayer({ current: aTrack(1), isPlaying: true });
    const { book: which, chapters } = anAudiobook();
    const { result } = renderHook(() => useWhatIsHeard(book.player, music.player));

    expect(result.current).toBe('music');

    act(() => {
      music.set({ isPlaying: false });
      book.player.open(which, tracksOf(chapters), null);
    });

    expect(result.current).toBe('book');
  });

  it('hears the one heard last where both are paused', () => {
    const book = aFakeAudiobookPlayer();
    const music = aFakeMusicPlayer({ current: aTrack(1) });
    const { book: which, chapters } = anAudiobook();
    const { result } = renderHook(() => useWhatIsHeard(book.player, music.player));

    act(() => {
      book.player.open(which, tracksOf(chapters), null);
      book.audio.fire('loadedmetadata');
      book.player.pause();
      book.audio.fire('pause');
      heardLast.hear('book');
    });

    expect(result.current).toBe('book');

    act(() => {
      heardLast.hear('music');
    });

    expect(result.current).toBe('music');
  });

  it('hears whichever alone has something loaded', () => {
    const book = aFakeAudiobookPlayer();
    const { book: which, chapters } = anAudiobook();
    const { result } = renderHook(() => useWhatIsHeard(book.player, aFakeMusicPlayer().player));

    act(() => {
      book.player.open(which, tracksOf(chapters), null);
      book.audio.fire('loadedmetadata');
      book.player.pause();
      book.audio.fire('pause');
    });

    expect(result.current).toBe('book');
  });
});
