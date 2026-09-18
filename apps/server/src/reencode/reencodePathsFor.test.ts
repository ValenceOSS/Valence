import { describe, expect, it } from 'vitest';
import { isInRenditionDirectory } from '@ValenceServer/library/isInRenditionDirectory';
import { reencodePathsFor } from './reencodePathsFor';

const original = '/media/Films/Azkaban (2004)/Azkaban (2004).mkv';

describe('reencodePathsFor', () => {
  it('keeps everything beside the film, so the renames are renames', () => {
    const paths = reencodePathsFor(original, 'abc');

    expect(paths.directory).toBe('/media/Films/Azkaban (2004)/.valence');
    expect(paths.output.startsWith(paths.directory)).toBe(true);
    expect(paths.aside.startsWith(paths.directory)).toBe(true);
    expect(paths.sample.startsWith(paths.directory)).toBe(true);
  });

  it('keeps the original container, which is what protects the row and its watch progress', () => {
    const paths = reencodePathsFor(original, 'abc');

    expect(paths.output.endsWith('.mkv')).toBe(true);
    expect(paths.aside.endsWith('.mkv')).toBe(true);
  });

  it('keeps an mp4 an mp4', () => {
    expect(reencodePathsFor('/media/Films/X/X.mp4', 'abc').output.endsWith('.mp4')).toBe(true);
  });

  it('puts everything somewhere the scanner will not look', () => {
    const paths = reencodePathsFor(original, 'abc');

    expect(isInRenditionDirectory(paths.output)).toBe(true);
    expect(isInRenditionDirectory(paths.aside)).toBe(true);
    expect(isInRenditionDirectory(paths.sample)).toBe(true);
  });

  it('tells the encode, the original and the sample apart', () => {
    const paths = reencodePathsFor(original, 'abc');

    expect(new Set([paths.output, paths.aside, paths.sample]).size).toBe(3);
  });

  it('gives two re-encodes of one film paths of their own', () => {
    expect(reencodePathsFor(original, 'abc').output).not.toBe(
      reencodePathsFor(original, 'def').output,
    );
  });

  it('copes with a file that has no extension at all', () => {
    expect(reencodePathsFor('/media/Films/X/X', 'abc').output).toBe(
      '/media/Films/X/.valence/abc',
    );
  });
});
