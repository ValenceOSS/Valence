import { describe, expect, it } from 'vitest';
import { readReleaseGroup } from './readReleaseGroup';

describe('readReleaseGroup', () => {
  it.each([
    ['[Erai-raws] One Piece - 1100 [1080p]', 'Erai-raws'],
    ['Movie.2023.1080p.WEB-DL.H.264-TURG', 'TURG'],
    ['The.Matrix.1999.2160p.WEB-DL.H.265-PiRaTeS[TGx]', 'PiRaTeS'],
    ['Movie.2010.BluRay.x265-GalaxyRG265.mkv', 'GalaxyRG265'],
    ['Inception (2010) [1080p x265] [Paso77]', 'Paso77'],
  ])('reads %s as %s', (name, group) => {
    expect(readReleaseGroup(name)).toBe(group);
  });

  it('takes no word of the name, tag or checksum for a group', () => {
    expect(readReleaseGroup('Show S01E01 1080p WEB-DL')).toBeNull();
    expect(readReleaseGroup('One Piece 1100 [1080p][Weekly]')).toBeNull();
    expect(readReleaseGroup('One Piece 1100 RAW [C3E7F3CF].mp4')).toBeNull();
    expect(readReleaseGroup('Movie 2023 1080p BluRay')).toBeNull();
  });
});
