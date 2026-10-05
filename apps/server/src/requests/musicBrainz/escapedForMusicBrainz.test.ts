import { describe, expect, it } from 'vitest';
import { escapedForMusicBrainz } from './escapedForMusicBrainz';

describe('escapedForMusicBrainz', () => {
  it('escapes what the search would read as its own', () => {
    expect(escapedForMusicBrainz('AC/DC: "Back" (in Black)')).toBe(
      'AC\\/DC\\: \\"Back\\" \\(in Black\\)',
    );
  });

  it('leaves ordinary words alone', () => {
    expect(escapedForMusicBrainz('Sleep Token')).toBe('Sleep Token');
  });
});
