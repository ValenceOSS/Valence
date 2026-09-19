import { describe, expect, it } from 'vitest';
import { albumFolderOf } from './albumFolderOf';

describe('albumFolderOf', () => {
  it('files an album in its artist’s folder, with its year', () => {
    expect(
      albumFolderOf('/media/Music', { artist: 'AC/DC', title: 'Back in Black', year: 1980 }),
    ).toBe('/media/Music/ACDC/Back in Black (1980)');
    expect(albumFolderOf('/media/Music', { artist: 'Björk', title: 'Homogenic', year: null })).toBe(
      '/media/Music/Björk/Homogenic',
    );
  });
});
