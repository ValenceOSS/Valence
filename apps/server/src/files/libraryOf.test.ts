import { describe, expect, it } from 'vitest';
import { aLibraryAt } from './aLibraryAt';
import { libraryOf } from './libraryOf';

const MEDIA = aLibraryAt('/media', 'media');
const ANIME = aLibraryAt('/media/anime', 'anime');

describe('libraryOf', () => {
  it('finds the library a path sits in, and the deepest where one is inside another', () => {
    expect(libraryOf([MEDIA, ANIME], '/media/films/Arrival.mkv')?.id).toBe('media');
    expect(libraryOf([MEDIA, ANIME], '/media/anime/Frieren')?.id).toBe('anime');
    expect(libraryOf([MEDIA, ANIME], '/media')?.id).toBe('media');
  });

  it('finds nothing for a path outside every library, however it is spelled', () => {
    expect(libraryOf([ANIME], '/media/anime-archive')).toBeNull();
    expect(libraryOf([ANIME], '/media/anime/../films')).toBeNull();
    expect(libraryOf([], '/media')).toBeNull();
  });
});
