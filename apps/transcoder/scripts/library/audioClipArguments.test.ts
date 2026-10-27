import { AUDIO_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIO_FILE_EXTENSIONS';
import { AUDIOBOOK_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIOBOOK_FILE_EXTENSIONS';
import { describe, expect, it } from 'vitest';
import { audioClipArguments } from './audioClipArguments';

const valueAfter = (args: string[], flag: string): string => args[args.indexOf(flag) + 1] ?? '';

describe('audioClipArguments', () => {
  it('has a recipe for every audio container the scanners read but the one FFmpeg cannot write', () => {
    const missing = [...AUDIO_FILE_EXTENSIONS, ...AUDIOBOOK_FILE_EXTENSIONS].filter(
      (extension) => audioClipArguments(extension, 2, `/out/clip.${extension}`) === null,
    );

    expect(missing).toStrictEqual(['ape']);
  });

  it('runs as long as asked, silent, and writes where it was told, last', () => {
    const args = audioClipArguments('flac', 30, '/out/clip.flac') ?? [];

    expect(valueAfter(args, '-t')).toBe('30');
    expect(valueAfter(args, '-i')).toContain('anullsrc');
    expect(args.at(-1)).toBe('/out/clip.flac');
  });

  it('writes a spoken book in the container a phone plays it from', () => {
    const args = audioClipArguments('M4B', 2, '/out/clip.m4b') ?? [];

    expect(valueAfter(args, '-c:a')).toBe('aac');
    expect(args[args.lastIndexOf('-f') + 1]).toBe('ipod');
  });
});
