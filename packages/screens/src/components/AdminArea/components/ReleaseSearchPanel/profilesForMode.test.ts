import { describe, expect, it } from 'vitest';
import { aQualityProfile } from '@ValenceScreens/testing/aQualityProfile';
import { profilesForMode } from './profilesForMode';

const HD = aQualityProfile({ id: 'hd', name: 'HD', kind: 'video' });

const LOSSLESS = aQualityProfile({ id: 'lossless', name: 'Lossless', kind: 'music' });

const ALL = [HD, LOSSLESS];

describe('profilesForMode', () => {
  it('offers only video profiles for a film or a series', () => {
    expect(profilesForMode(ALL, 'movie')).toEqual([HD]);
    expect(profilesForMode(ALL, 'tv')).toEqual([HD]);
  });

  it('offers only music profiles for music', () => {
    expect(profilesForMode(ALL, 'music')).toEqual([LOSSLESS]);
  });

  it('offers none for a book, which no profile judges', () => {
    expect(profilesForMode(ALL, 'book')).toEqual([]);
  });

  it('offers all of them where the search is not for anything in particular', () => {
    expect(profilesForMode(ALL, 'search')).toEqual(ALL);
  });

  it('has nothing to offer where there are no profiles', () => {
    expect(profilesForMode([], 'movie')).toEqual([]);
  });
});
