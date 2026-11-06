import { describe, expect, it } from 'vitest';
import { nfoOf } from './nfoOf';
import type { NfoTitle } from './NfoTitle.types';

const FILM: NfoTitle = {
  kind: 'movie',
  title: 'Cats & Dogs',
  originalTitle: null,
  sortTitle: 'Cats and Dogs',
  year: 2001,
  plot: 'A <short> one.',
  tagline: null,
  premiered: '2001-07-04',
  rating: 5.5,
  genres: ['Comedy', 'Family'],
  tags: [],
  studios: ['A studio'],
  directors: ['A director'],
  writers: [],
  cast: [{ name: 'Someone', role: 'A part' }],
  season: null,
  episode: null,
  ids: { tmdb: '1', imdb: 'tt0000001', tvdb: null },
};

describe('nfoOf', () => {
  it('writes a film in Kodi’s format, escaping what XML cannot hold as it is', () => {
    const written = nfoOf(FILM);

    expect(written).toContain('<movie>');
    expect(written).toContain('<title>Cats &amp; Dogs</title>');
    expect(written).toContain('<plot>A &lt;short&gt; one.</plot>');
    expect(written).toContain('<genre>Comedy</genre>\n  <genre>Family</genre>');
    expect(written).toContain('<uniqueid type="tmdb" default="true">1</uniqueid>');
    expect(written).toContain(
      '<actor>\n    <name>Someone</name>\n    <role>A part</role>\n  </actor>',
    );
    expect(written).not.toContain('<tagline>');
  });

  it('writes an episode with its season, number and air date', () => {
    const written = nfoOf({ ...FILM, kind: 'episodedetails', season: 1, episode: 2 });

    expect(written).toContain('<episodedetails>');
    expect(written).toContain('<season>1</season>\n  <episode>2</episode>');
    expect(written).toContain('<aired>2001-07-04</aired>');
  });
});
