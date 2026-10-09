import { describe, expect, it } from 'vitest';
import { libraryFolderOf } from './libraryFolderOf';

describe('libraryFolderOf', () => {
  it('names the folder by title and year, inside the library', () => {
    expect(
      libraryFolderOf({
        libraryPath: '/media/Films/',
        libraryFolder: null,
        title: 'Dune',
        year: 2021,
      }),
    ).toBe('/media/Films/Dune (2021)');
  });

  it('keeps a series in the folder the library already keeps it in', () => {
    expect(
      libraryFolderOf({
        libraryPath: '/media/Series',
        libraryFolder: '/media/Series/Show',
        title: 'Show',
        year: 2019,
      }),
    ).toBe('/media/Series/Show');
  });
});
