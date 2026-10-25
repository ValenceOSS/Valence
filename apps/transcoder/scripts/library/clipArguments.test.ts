import { VIDEO_FILE_EXTENSIONS } from '@ValenceContracts/constants/VIDEO_FILE_EXTENSIONS';
import { describe, expect, it } from 'vitest';
import { clipArguments } from './clipArguments';

const valueAfter = (args: string[], flag: string): string => args[args.indexOf(flag) + 1] ?? '';

describe('clipArguments', () => {
  it('has a recipe for every container the scanner reads', () => {
    for (const extension of VIDEO_FILE_EXTENSIONS) {
      expect(clipArguments(extension, 2, `/out/clip.${extension}`)).not.toBeNull();
    }
  });

  it('has none for a container the scanner would pass over', () => {
    expect(clipArguments('txt', 2, '/out/clip.txt')).toBeNull();
  });

  it('reads the extension whatever its case', () => {
    expect(clipArguments('MKV', 2, '/out/clip.MKV')).not.toBeNull();
  });

  it('runs as long as asked', () => {
    expect(valueAfter(clipArguments('mkv', 30, '/out/clip.mkv') ?? [], '-t')).toBe('30');
  });

  it('writes to the place it was given, last', () => {
    expect(clipArguments('mkv', 2, '/out/clip.mkv')?.at(-1)).toBe('/out/clip.mkv');
  });

  it('carries a sound track, since a file without one is not what a library holds', () => {
    expect(clipArguments('mp4', 2, '/out/clip.mp4')).toContain('1:a');
  });

  it('uses codecs a webm may hold', () => {
    const args = clipArguments('webm', 2, '/out/clip.webm') ?? [];

    expect(valueAfter(args, '-c:v')).toBe('libvpx-vp9');
    expect(valueAfter(args, '-c:a')).toBe('libopus');
  });
});
