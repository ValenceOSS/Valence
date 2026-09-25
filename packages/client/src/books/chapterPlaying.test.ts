import { describe, expect, it } from 'vitest';
import { chapterPlaying } from '@ValenceClient/books/chapterPlaying';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { aFakeAudiobookPlayer } from '@ValenceClient/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';

describe('chapterPlaying', () => {
  it('is the last chapter to have started', () => {
    const { player } = aFakeAudiobookPlayer();
    const { book, chapters } = anAudiobook();

    player.open(book, tracksOf(chapters), {
      chapterId: chapters[0]?.id ?? '',
      positionSeconds: 400,
    });

    expect(chapterPlaying(player.read())).toBe(2);
  });

  it('is none where there are no chapters', () => {
    expect(chapterPlaying(aFakeAudiobookPlayer().player.read())).toBe(-1);
  });
});
