import { describe, expect, it } from 'vitest';
import { taggedCopyArguments } from './taggedCopyArguments';

const COPY = {
  clip: '/scratch/clip.mp3',
  output: '/music/Band/Album/01 - Song.mp3',
  extension: 'mp3',
  tags: [
    ['artist', 'Band'],
    ['title', 'Song'],
  ] as const,
  chapters: null,
};

describe('taggedCopyArguments', () => {
  it('copies the clip without encoding it again, carrying each tag', () => {
    const args = taggedCopyArguments(COPY) ?? [];

    expect(args.join(' ')).toContain('-c copy');
    expect(args.join(' ')).toContain('-metadata artist=Band -metadata title=Song');
    expect(args.at(-1)).toBe(COPY.output);
  });

  it('writes tags an older reader understands into an mp3', () => {
    expect(taggedCopyArguments(COPY)).toContain('-id3v2_version');
  });

  it('marks the chapters of a spoken book from the file it is given', () => {
    const args =
      taggedCopyArguments({
        ...COPY,
        extension: 'm4b',
        output: '/books/Author/Book/Book.m4b',
        chapters: '/scratch/chapters.txt',
      }) ?? [];

    expect(args.join(' ')).toContain('-i /scratch/chapters.txt -map_chapters 1');
    expect(args.join(' ')).not.toContain('-id3v2_version');
  });

  it('has nothing for a container there is no recipe for', () => {
    expect(taggedCopyArguments({ ...COPY, extension: 'ape' })).toBeNull();
  });
});
