import { describe, expect, it } from 'vitest';
import { readSource } from './readSource';

describe('readSource', () => {
  it.each([
    ['Movie 2160p BDRemux', 'remux'],
    ['Movie UHD BluRay REMUX', 'remux'],
    ['Movie Blu ray 1080p', 'bluray'],
    ['Movie BRRip', 'bluray'],
    ['Movie UHDrip HDR', 'bluray'],
    ['One Piece JPBD HEVC', 'bluray'],
    ['Movie WEBRip x265', 'webrip'],
    ['Movie HDRip', 'webrip'],
    ['Movie WEB-DL', 'webdl'],
    ['Show 1080p WEB h264', 'webdl'],
    ['Show HDTV x264', 'hdtv'],
    ['Movie DVDRip XviD', 'dvd'],
    ['Movie HDTS x264', 'telesync'],
    ['Movie HDCAM', 'cam'],
    ['Show 1080p AMZN DDP5 1', 'webdl'],
  ] as const)('reads %s as %s', (name, source) => {
    expect(readSource(name)).toBe(source);
  });

  it('says nothing where a name does not', () => {
    expect(readSource('Oppenheimer 2023 1080p')).toBeNull();
  });
});
