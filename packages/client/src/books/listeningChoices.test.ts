import { describe, expect, it } from 'vitest';
import { listeningChoices } from '@ValenceClient/books/listeningChoices';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { aFakeAudiobookPlayer } from '@ValenceClient/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';

const opened = () => {
  const fake = aFakeAudiobookPlayer();
  const { book, chapters } = anAudiobook();

  fake.player.open(book, tracksOf(chapters), null);
  fake.audio.fire('loadedmetadata');

  return fake;
};

describe('listeningChoices', () => {
  it('offers every speed, marking the one it plays at', () => {
    const { player } = opened();

    player.setSpeed(1.5);

    const speeds = listeningChoices('speed', player.read());

    expect(speeds.map(({ label }) => label)).toEqual([
      '0.75×',
      '1×',
      '1.25×',
      '1.5×',
      '1.75×',
      '2×',
    ]);
    expect(speeds.find(({ isCurrent }) => isCurrent)?.id).toBe('1.5');
  });

  it('offers turning the sleep timer off, minutes and the end of the chapter', () => {
    const { player } = opened();
    const sleep = listeningChoices('sleep', player.read());

    expect(sleep.map(({ id }) => id)).toEqual(['off', '15', '30', '45', '60', 'endOfChapter']);
    expect(sleep[0]?.isCurrent).toBe(true);
  });

  it('lists every chapter with how long it lasts, marking the one playing', () => {
    const { player } = opened();
    const chapters = listeningChoices('chapters', player.read());

    expect(chapters.map(({ label }) => label)).toEqual(['Part 1', 'The Institute', 'The Passage']);
    expect(chapters[1]?.detail).toBe('5:00');
    expect(chapters[0]?.isCurrent).toBe(true);
  });
});
