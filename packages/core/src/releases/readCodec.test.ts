import { describe, expect, it } from 'vitest';
import { readCodec } from './readCodec';

describe('readCodec', () => {
  it.each([
    ['Movie VVC H 266', 'h266'],
    ['Movie AV1 Opus', 'av1'],
    ['Movie x265 10bit', 'h265'],
    ['Movie H 265', 'h265'],
    ['Movie HEVC', 'h265'],
    ['Movie x264', 'h264'],
    ['Movie AVC REMUX', 'h264'],
    ['Movie Hi10P', 'h264'],
    ['Movie XviD', 'xvid'],
    ['Movie MPEG-2', 'mpeg2'],
  ] as const)('reads %s as %s', (name, codec) => {
    expect(readCodec(name)).toBe(codec);
  });

  it('says nothing where a name does not', () => {
    expect(readCodec('Movie 1080p BluRay')).toBeNull();
  });
});
