import { describe, expect, it } from 'vitest';
import { nameOfSource } from './nameOfSource';

describe('nameOfSource', () => {
  it('names a site Valence knows', () => {
    expect(nameOfSource('https://api.themoviedb.org/3/search/movie')).toBe('TMDB');
    expect(nameOfSource('https://musicbrainz.org/ws/2/release-group')).toBe('MusicBrainz');
    expect(nameOfSource('https://covers.openlibrary.org/b/id/1.jpg')).toBe('Open Library');
  });

  it('does not mistake a host that only ends the same way for the site', () => {
    expect(nameOfSource('https://notmusicbrainz.org/ws/2')).toBe('notmusicbrainz.org');
  });

  it('names an address it cannot read by itself rather than failing', () => {
    expect(nameOfSource('/covers/1.jpg')).toBe('/covers/1.jpg');
  });

  it('falls back to the host for a site it does not know', () => {
    expect(nameOfSource('https://films.example/api')).toBe('films.example');
  });
});
