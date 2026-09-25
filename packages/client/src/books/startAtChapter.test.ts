import { describe, expect, it } from 'vitest';
import { startAtChapter } from '@ValenceClient/books/startAtChapter';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { aFakeAudiobookPlayer } from '@ValenceClient/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';

describe('startAtChapter', () => {
  it('opens a book at the start of a chapter it marks inside a track', () => {
    const { player, audio } = aFakeAudiobookPlayer();
    const { book, chapters } = anAudiobook();

    startAtChapter(player, book, tracksOf(chapters), 2);

    expect(player.read().book?.id).toBe(book.id);
    expect(player.read().bookPositionSeconds).toBe(900);
    expect(audio.src).toContain(chapters[0]?.id);
  });

  it('goes straight to the chapter in the book already open, and plays', () => {
    const { player, audio } = aFakeAudiobookPlayer();
    const { book, chapters } = anAudiobook();
    const tracks = tracksOf(chapters);

    player.open(book, tracks, null);
    audio.fire('loadedmetadata');
    player.pause();
    audio.fire('pause');
    startAtChapter(player, book, tracks, 1);

    expect(player.read().bookPositionSeconds).toBe(600);
    expect(player.read().isPlaying).toBe(true);
  });

  it('does nothing for a chapter the book does not have', () => {
    const { player } = aFakeAudiobookPlayer();
    const { book, chapters } = anAudiobook();

    startAtChapter(player, book, tracksOf(chapters), 9);

    expect(player.read().book).toBeNull();
  });
});
