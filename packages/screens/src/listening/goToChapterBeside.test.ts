import { describe, expect, it } from 'vitest';
import { goToChapterBeside } from '@ValenceScreens/listening/goToChapterBeside';
import { tracksOf } from '@ValenceScreens/listening/tracksOf';
import { aFakeAudiobookPlayer } from '@ValenceScreens/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceScreens/testing/anAudiobook';

/**
 * A player partway into the book, ready to move.
 *
 * @param positionSeconds - How far into the second track it is.
 * @returns The player and its audio.
 */
const partway = (positionSeconds: number) => {
  const fake = aFakeAudiobookPlayer();
  const { book, chapters } = anAudiobook();

  fake.player.open(book, tracksOf(chapters), {
    chapterId: chapters[0]?.id ?? '',
    positionSeconds,
  });
  fake.audio.fire('loadedmetadata');

  return fake;
};

describe('goToChapterBeside', () => {
  it('goes on to the next chapter', () => {
    const { player } = partway(10);

    goToChapterBeside(player, 1);

    expect(player.read().bookPositionSeconds).toBe(900);
  });

  it('goes back to the start of the chapter playing, once it is a few seconds in', () => {
    const { player } = partway(310);

    goToChapterBeside(player, -1);

    expect(player.read().bookPositionSeconds).toBe(900);
  });

  it('goes back to the chapter before where one has only just begun', () => {
    const { player } = partway(301);

    goToChapterBeside(player, -1);

    expect(player.read().bookPositionSeconds).toBe(600);
  });
});
