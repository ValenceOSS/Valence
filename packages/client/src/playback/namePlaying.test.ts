import { describe, expect, it } from 'vitest';
import { namePlaying } from './namePlaying';

describe('namePlaying', () => {
  it('names a film by its title, and dates it by its year', () => {
    expect(namePlaying({ title: 'Arrival', year: 2016, releaseDate: '2016-11-10' })).toEqual({
      name: 'Arrival',
      year: 2016,
    });
  });

  it('names an episode by its programme, where in it this is, and what it is called', () => {
    expect(
      namePlaying({
        title: 'Breakage',
        seriesTitle: 'Breaking Bad',
        seasonNumber: 2,
        episodeNumber: 5,
        year: 2008,
        releaseDate: '2009-04-05',
      }).name,
    ).toBe('Breaking Bad · S2E5 · Breakage');
  });

  it('dates an episode by when it was shown, not when its programme began', () => {
    expect(
      namePlaying({
        title: 'Felina',
        seriesTitle: 'Breaking Bad',
        seasonNumber: 5,
        episodeNumber: 16,
        year: 2008,
        releaseDate: '2013-09-29',
      }).year,
    ).toBe(2013);
  });

  it("falls back to the programme's year for an episode with no air date", () => {
    expect(
      namePlaying({ title: 'Breakage', seriesTitle: 'Breaking Bad', year: 2008, releaseDate: null })
        .year,
    ).toBe(2008);
  });

  it('says nothing of the year where nothing was matched', () => {
    expect(namePlaying({ title: 'Arrival' }).year).toBeNull();
  });
});
