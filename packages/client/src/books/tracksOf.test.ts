import { describe, expect, it } from 'vitest';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';

describe('tracksOf', () => {
  it('lists a book’s sound in the order it is numbered, with each track’s marks', () => {
    const tracks = tracksOf(anAudiobook().chapters);

    expect(tracks.map((track) => track.title)).toEqual(['Part 1', 'Part 2']);
    expect(tracks[1]?.marks).toHaveLength(2);
    expect(tracks[0]?.durationSeconds).toBe(600);
  });

  it('leaves out the text of a book that can be read as well', () => {
    const { chapters } = anAudiobook();
    const [first] = chapters;

    expect(
      tracksOf(first === undefined ? [] : [first, { ...first, id: 'text', format: 'epub' }]),
    ).toHaveLength(1);
  });

  it('counts a track nobody measured as lasting nothing', () => {
    const [first] = anAudiobook().chapters;

    expect(
      tracksOf(first === undefined ? [] : [{ ...first, durationSeconds: null }])[0]
        ?.durationSeconds,
    ).toBe(0);
  });
});
