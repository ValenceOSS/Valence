import { describe, expect, it } from 'vitest';
import { chooseListening } from '@ValenceClient/books/chooseListening';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { aFakeAudiobookPlayer } from '@ValenceClient/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';

describe('chooseListening', () => {
  it('plays at the speed, sets the sleep timer, or goes to the chapter chosen', () => {
    const { player, audio } = aFakeAudiobookPlayer();
    const { book, chapters } = anAudiobook();

    player.open(book, tracksOf(chapters), null);
    audio.fire('loadedmetadata');

    chooseListening(player, 'speed', '1.25');
    chooseListening(player, 'sleep', 'endOfChapter');
    chooseListening(player, 'chapters', '2');

    expect(player.read().speed).toBe(1.25);
    expect(player.read().sleep.kind).toBe('endOfChapter');
    expect(player.read().bookPositionSeconds).toBe(900);

    chooseListening(player, 'sleep', '15');

    expect(player.read().sleep.kind).toBe('after');
  });
});
