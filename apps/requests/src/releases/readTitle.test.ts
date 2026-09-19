import { describe, expect, it } from 'vitest';
import { readTitle } from './readTitle';

describe('readTitle', () => {
  it.each([
    ['The Matrix 1999 1080p BluRay', 'The Matrix', 1999],
    ['Inception (2010 ITA/ENG) [1080p x265]', 'Inception', 2010],
    ['Blade Runner 2049 2017 2160p', 'Blade Runner 2049', 2017],
    ['1917 2019 1080p BluRay', '1917', 2019],
    ['The Office (2005 2013) Complete Series 1080p', 'The Office', 2005],
    ['Breaking Bad S05E14 Ozymandias 1080p', 'Breaking Bad', null],
    ['[ASW] One Piece - 1100 [1080p]', 'One Piece', null],
    ['[Anime Land] One Piece 1100 (WEBRip 1080p)', 'One Piece', null],
    ['Various Artists - Now Music 100 (2018) Opus', 'Various Artists - Now Music 100', 2018],
    ['Pink Floyd - The Wall', 'Pink Floyd - The Wall', null],
  ] as const)('reads %s as %s, %s', (name, title, year) => {
    expect(readTitle(name)).toEqual({ title, year });
  });

  it('keeps a year a name starts with as its title', () => {
    expect(readTitle('(2012) 1080p BluRay')).toEqual({ title: '2012', year: null });
  });
});
