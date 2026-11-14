import { describe, expect, it } from 'vitest';
import { foldersAbove } from '@ValenceRequests/origins/foldersAbove';

describe('foldersAbove', () => {
  it('lists the folders a file sits in, nearest first', () => {
    expect(foldersAbove('/media/music/Artist/Album/01.flac')).toEqual([
      '/media/music/Artist/Album',
      '/media/music/Artist',
      '/media/music',
      '/media',
      '/',
    ]);
  });

  it('goes no more than six levels up', () => {
    expect(foldersAbove('/a/b/c/d/e/f/g/h/i.mkv')).toHaveLength(6);
  });
});
