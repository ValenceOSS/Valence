import { describe, expect, it } from 'vitest';
import { libraryDrives } from './libraryDrives';

const disk = (
  mountPoint: string,
  device: string | null,
  totalBytes: number,
  availableBytes: number,
) => ({ mountPoint, device, totalBytes, availableBytes });

const ROOT = disk('/', 'overlay', 500, 250);
const FILMS = disk('/media/films', 'tank/films', 700, 400);
const SHOWS = disk('/media/shows', 'tank/shows', 600, 400);
const SECOND = disk('/mnt/second', '/dev/sdb1', 4000, 3000);

describe('libraryDrives', () => {
  it('finds nothing where no library can be placed on a disk', () => {
    expect(libraryDrives([], ['/media/films'])).toEqual([]);
  });

  it('counts the datasets of one ZFS pool as one drive, the pool', () => {
    expect(libraryDrives([ROOT, FILMS, SHOWS], ['/media/films', '/media/shows/a'])).toEqual([
      { ...FILMS, totalBytes: 900 },
    ]);
  });

  it('gives the pool’s room left where a quota holds a library dataset to less', () => {
    const capped = disk('/media/shows', 'tank/shows', 210, 10);

    expect(libraryDrives([FILMS, capped], ['/media/films', '/media/shows'])).toEqual([
      { ...capped, totalBytes: 900, availableBytes: 400 },
    ]);
  });

  it('keeps a drive that is not part of a pool as it is, the tightest first', () => {
    expect(libraryDrives([FILMS, SECOND], ['/mnt/second/music', '/media/films'])).toEqual([
      { ...FILMS, totalBytes: 700 },
      SECOND,
    ]);
  });
});
