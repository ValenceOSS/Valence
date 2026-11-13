import { describe, expect, it } from 'vitest';
import { libraryDisks } from './libraryDisks';
import type { DiskUse } from './libraryDisks';

const disk = (mountPoint: string, totalBytes: number, availableBytes: number): DiskUse => ({
  mountPoint,
  device: null,
  totalBytes,
  availableBytes,
});

const root = disk('/', 500, 250);
const media = disk('/media', 8000, 4000);
const archive = disk('/media/archive', 2000, 100);
const second = disk('/mnt/media2', 4000, 3000);

describe('libraryDisks', () => {
  it('finds nothing where no library can be placed on a disk', () => {
    expect(libraryDisks([], ['/media/films'])).toEqual([]);
  });

  it('lists every disk the libraries live on, each once', () => {
    expect(
      libraryDisks([media, second], ['/media/films', '/media/shows', '/mnt/media2/music']),
    ).toEqual([second, media].sort((one, other) => one.availableBytes - other.availableBytes));
  });

  it('puts the disk with the least room left first', () => {
    expect(
      libraryDisks([media, second, archive], ['/mnt/media2/a', '/media/archive/b', '/media/c'])[0],
    ).toBe(archive);
  });

  it('takes the deepest mount a path is under', () => {
    expect(libraryDisks([root, media, archive], ['/media/archive/films'])).toEqual([archive]);
  });

  it('leaves out disks holding no library', () => {
    expect(libraryDisks([root, media, second], ['/media/films'])).toEqual([media]);
  });

  it('does not take a sibling mount for one whose name it starts with', () => {
    expect(libraryDisks([media, second], ['/mnt/media2x/films'])).toEqual([]);
  });

  it('counts the datasets of one ZFS pool as one drive, the pool', () => {
    const films = {
      mountPoint: '/media/films',
      device: 'tank/films',
      totalBytes: 700,
      availableBytes: 400,
    };
    const shows = {
      mountPoint: '/media/shows',
      device: 'tank/shows',
      totalBytes: 600,
      availableBytes: 400,
    };

    expect(libraryDisks([root, films, shows], ['/media/films', '/media/shows/a'])).toEqual([
      { ...films, totalBytes: 900 },
    ]);
  });
});
