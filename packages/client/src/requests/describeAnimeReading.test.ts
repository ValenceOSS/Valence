import { describe, expect, it } from 'vitest';
import { describeAnimeReading } from './describeAnimeReading';

describe('describeAnimeReading', () => {
  it('says the episodes a reading holds and how it numbers them', () => {
    expect(
      describeAnimeReading({ numbering: 'perCour', episodes: [{ season: 1, episode: 13 }] }),
    ).toBe('S01E13, numbered within each cour');
    expect(
      describeAnimeReading({
        numbering: 'aired',
        episodes: [
          { season: 2, episode: 1 },
          { season: 2, episode: 12 },
        ],
      }),
    ).toBe('S02E01 to S02E12, the catalogue’s numbering');
  });
});
