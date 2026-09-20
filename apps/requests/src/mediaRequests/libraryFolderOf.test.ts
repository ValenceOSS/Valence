import { describe, expect, it } from 'vitest';
import { libraryFolderOf } from './libraryFolderOf';

describe('libraryFolderOf', () => {
  it('names the folder by title and year, inside the library', () => {
    expect(libraryFolderOf({ libraryPath: '/media/Films/', title: 'Dune', year: 2021 })).toBe(
      '/media/Films/Dune (2021)',
    );
  });
});
