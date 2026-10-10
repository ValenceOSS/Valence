import { describe, expect, it } from 'vitest';
import { askOfEntry } from './askOfEntry';

const IN = { libraryId: null };

describe('askOfEntry', () => {
  it('follows a film or series by its catalogue id, a series by the seasons named', () => {
    expect(askOfEntry({ kind: 'film', catalogueId: '27', ...IN })).toEqual({
      kind: 'film',
      tmdbId: 27,
      origin: 'monitored',
    });
    expect(askOfEntry({ kind: 'series', catalogueId: '9', ...IN }, [2])).toEqual({
      kind: 'series',
      tmdbId: 9,
      seasons: [2],
      origin: 'monitored',
    });
  });

  it('follows music by its MusicBrainz id', () => {
    expect(askOfEntry({ kind: 'album', catalogueId: 'mb-1', ...IN })).toEqual({
      kind: 'album',
      musicBrainzId: 'mb-1',
      origin: 'monitored',
    });
  });

  it('follows a title in the library that already holds it', () => {
    expect(askOfEntry({ kind: 'film', catalogueId: '27', libraryId: 'films' })).toMatchObject({
      libraryId: 'films',
    });
  });

  it('follows nothing it cannot name', () => {
    expect(askOfEntry({ kind: 'film', catalogueId: null, ...IN })).toBeNull();
    expect(askOfEntry({ kind: 'film', catalogueId: 'tt123', ...IN })).toBeNull();
    expect(askOfEntry({ kind: 'book', catalogueId: 'OL1W', ...IN })).toBeNull();
  });
});
