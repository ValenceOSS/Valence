import { describe, expect, it } from 'vitest';
import { askOfEntry } from './askOfEntry';

describe('askOfEntry', () => {
  it('asks for a film or series by its catalogue id, a series by the seasons named', () => {
    expect(askOfEntry({ kind: 'film', catalogueId: '27' })).toEqual({ kind: 'film', tmdbId: 27 });
    expect(askOfEntry({ kind: 'series', catalogueId: '9' }, [2])).toEqual({
      kind: 'series',
      tmdbId: 9,
      seasons: [2],
    });
  });

  it('asks for music by its MusicBrainz id', () => {
    expect(askOfEntry({ kind: 'album', catalogueId: 'mb-1' })).toEqual({
      kind: 'album',
      musicBrainzId: 'mb-1',
    });
  });

  it('asks for nothing it cannot name', () => {
    expect(askOfEntry({ kind: 'film', catalogueId: null })).toBeNull();
    expect(askOfEntry({ kind: 'film', catalogueId: 'tt123' })).toBeNull();
    expect(askOfEntry({ kind: 'book', catalogueId: 'OL1W' })).toBeNull();
  });
});
