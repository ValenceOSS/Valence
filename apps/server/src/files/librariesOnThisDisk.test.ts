import { describe, expect, it } from 'vitest';
import { aLibraryAt } from './aLibraryAt';
import { librariesOnThisDisk } from './librariesOnThisDisk';

const FILMS = aLibraryAt('/media/films', 'films');
const SHOWS = { ...aLibraryAt('/media/shows', 'shows'), linkedServerId: null };
const THEIRS = {
  ...aLibraryAt('linked://6f1c0b8e-2b6c-4d8e-9d3a-6b3f6f0e1a2b/api/libraries/1', 'theirs'),
  linkedServerId: '6f1c0b8e-2b6c-4d8e-9d3a-6b3f6f0e1a2b',
};

describe('librariesOnThisDisk', () => {
  it('keeps the libraries with files on this server', () => {
    expect(librariesOnThisDisk([FILMS, SHOWS]).map((library) => library.id)).toEqual([
      'films',
      'shows',
    ]);
  });

  it('leaves out the libraries a linked server shares', () => {
    expect(librariesOnThisDisk([FILMS, THEIRS, SHOWS]).map((library) => library.id)).toEqual([
      'films',
      'shows',
    ]);
  });
});
