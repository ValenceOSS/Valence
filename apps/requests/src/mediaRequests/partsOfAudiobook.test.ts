import { describe, expect, it } from 'vitest';
import { partsOfAudiobook } from './partsOfAudiobook';

describe('partsOfAudiobook', () => {
  it('counts the parts and finds none missing where every number is there', () => {
    expect(partsOfAudiobook(['01 - Book', '02 - Book', '03 - Book'])).toEqual({
      count: 3,
      missing: [],
    });
  });

  it('finds the parts missing between the first and the last', () => {
    expect(partsOfAudiobook(['Book Part 1', 'Book Part 2', 'Book Part 4', 'Book Part 6'])).toEqual({
      count: 6,
      missing: [3, 5],
    });
  });

  it('takes the total a name gives, so missing last parts are found too', () => {
    expect(partsOfAudiobook(['Book (1 of 4)', 'Book (2 of 4)'])).toEqual({
      count: 4,
      missing: [3, 4],
    });
  });

  it('judges nothing where the names cannot all be numbered, or repeat a number', () => {
    expect(partsOfAudiobook(['Book', 'Book Epilogue'])).toEqual({ count: 2, missing: [] });
    expect(partsOfAudiobook(['01', '02', '01', '02'])).toEqual({ count: 4, missing: [] });
    expect(partsOfAudiobook(['Book'])).toEqual({ count: 1, missing: [] });
  });
});
