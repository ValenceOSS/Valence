import { describe, expect, it } from 'vitest';
import { planUpload } from '@ValenceServer/uploads/planUpload';

describe('planUpload', () => {
  it('puts a file inside the library, where its path says', () => {
    expect(planUpload('/media/films', 'Arrival (2016)/Arrival (2016).mkv', 'movies')).toEqual({
      kind: 'planned',
      destination: '/media/films/Arrival (2016)/Arrival (2016).mkv',
    });
  });

  it('puts a lone file straight in the library', () => {
    expect(planUpload('/media/films', 'Arrival.mkv', 'movies')).toEqual({
      kind: 'planned',
      destination: '/media/films/Arrival.mkv',
    });
  });

  it.each([
    '',
    '../Arrival.mkv',
    'a/../../Arrival.mkv',
    './Arrival.mkv',
    '/etc/Arrival.mkv',
    'a//Arrival.mkv',
    'a\\Arrival.mkv',
    '.valence/Arrival.mkv',
    'a/.hidden/Arrival.mkv',
    'Arrival\0.mkv',
  ])('refuses %j, which is not a plain path inside the library', (path) => {
    expect(planUpload('/media/films', path, 'movies').kind).toBe('badPath');
  });

  it('refuses a path with too many folders in it', () => {
    expect(planUpload('/media/films', `${'a/'.repeat(12)}b.mkv`, 'movies').kind).toBe('badPath');
  });

  it('refuses a name too long to be one', () => {
    expect(planUpload('/media/films', `${'a'.repeat(256)}.mkv`, 'movies').kind).toBe('badPath');
  });

  it('refuses a file the library would not read, rather than leaving it where no scan will look', () => {
    expect(planUpload('/media/films', 'notes.txt', 'movies').kind).toBe('refused');
    expect(planUpload('/media/music', 'Arrival.mkv', 'music').kind).toBe('refused');
  });

  it('reads a track for music and a book for books', () => {
    expect(planUpload('/media/music', 'Artist/01.flac', 'music').kind).toBe('planned');
    expect(planUpload('/media/books', 'Vol 1.cbz', 'books').kind).toBe('planned');
  });
});
