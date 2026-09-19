import { describe, expect, it } from 'vitest';
import { isInRenditionDirectory } from '@ValenceServer/library/isInRenditionDirectory';
import { reencodePathsFor } from './reencodePathsFor';

const LIBRARY = '/Users/dan/Flux/Movies';

const original = `${LIBRARY}/Azkaban (2004)/Azkaban (2004).mkv`;

describe('reencodePathsFor', () => {
  it('keeps one folder at the top of the library rather than one beside each film', () => {
    const paths = reencodePathsFor(LIBRARY, original, 'abc');

    expect(paths.directory).toBe('/Users/dan/Flux/Movies/.valence');
  });

  it('puts every file it touches in that one folder', () => {
    const paths = reencodePathsFor(LIBRARY, original, 'abc');

    expect(paths.output.startsWith(paths.directory)).toBe(true);
    expect(paths.aside.startsWith(paths.directory)).toBe(true);
    expect(paths.sample.startsWith(paths.directory)).toBe(true);
  });

  it('stays under the library root, so swapping stays a rename rather than a copy', () => {
    expect(reencodePathsFor(LIBRARY, original, 'abc').directory.startsWith(LIBRARY)).toBe(true);
  });

  it('keeps the original container, which is what protects the row and its watch progress', () => {
    const paths = reencodePathsFor(LIBRARY, original, 'abc');

    expect(paths.output.endsWith('.mkv')).toBe(true);
    expect(paths.aside.endsWith('.mkv')).toBe(true);
  });

  it('keeps an mp4 an mp4', () => {
    expect(
      reencodePathsFor(LIBRARY, `${LIBRARY}/X/X.mp4`, 'abc').output.endsWith('.mp4'),
    ).toBe(true);
  });

  it('gives each library its own folder', () => {
    const films = reencodePathsFor('/Users/dan/Flux/Movies', original, 'abc');
    const shows = reencodePathsFor(
      '/Users/dan/Flux/Shows',
      '/Users/dan/Flux/Shows/Fringe/s01e01.mkv',
      'abc',
    );

    expect(films.directory).not.toBe(shows.directory);
  });

  it('puts everything somewhere the scanner will not look', () => {
    const paths = reencodePathsFor(LIBRARY, original, 'abc');

    expect(isInRenditionDirectory(paths.output)).toBe(true);
    expect(isInRenditionDirectory(paths.aside)).toBe(true);
    expect(isInRenditionDirectory(paths.sample)).toBe(true);
  });

  it('tells the encode, the original and the sample apart', () => {
    const paths = reencodePathsFor(LIBRARY, original, 'abc');

    expect(new Set([paths.output, paths.aside, paths.sample]).size).toBe(3);
  });

  it('gives two re-encodes of one film paths of their own', () => {
    expect(reencodePathsFor(LIBRARY, original, 'abc').output).not.toBe(
      reencodePathsFor(LIBRARY, original, 'def').output,
    );
  });

  it('copes with a library root somebody wrote a trailing slash on', () => {
    expect(reencodePathsFor(`${LIBRARY}/`, original, 'abc').directory).toBe(
      '/Users/dan/Flux/Movies/.valence',
    );
  });

  it('copes with a file that has no extension at all', () => {
    expect(reencodePathsFor(LIBRARY, `${LIBRARY}/X/X`, 'abc').output).toBe(
      '/Users/dan/Flux/Movies/.valence/abc',
    );
  });
});
