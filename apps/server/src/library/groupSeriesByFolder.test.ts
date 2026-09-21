import { describe, expect, it } from 'vitest';
import { groupSeriesByFolder } from './createMediaStore';

const CURB = '/media/shows/Curb Your Enthusiasm';

describe('groupSeriesByFolder', () => {
  it('gathers the programmes one folder was split across', () => {
    const items = [
      { path: `${CURB}/Season 1/one.mkv`, seriesId: 'by-title' },
      { path: `${CURB}/Season 11/two.mkv`, seriesId: 'by-catalogue' },
    ];

    const foldersByPath = new Map(items.map((item) => [item.path, CURB]));

    expect(groupSeriesByFolder(items, foldersByPath).get(CURB)?.sort()).toEqual([
      'by-catalogue',
      'by-title',
    ]);
  });

  it('leaves two folders as two programmes', () => {
    const items = [
      { path: '/media/shows/Dexter/one.mkv', seriesId: 'dexter' },
      { path: '/media/shows/Dexter - New Blood/one.mkv', seriesId: 'new-blood' },
    ];

    const foldersByPath = new Map([
      ['/media/shows/Dexter/one.mkv', '/media/shows/Dexter'],
      ['/media/shows/Dexter - New Blood/one.mkv', '/media/shows/Dexter - New Blood'],
    ]);

    expect(groupSeriesByFolder(items, foldersByPath).size).toBe(2);
  });

  it('files a programme where most of it lives, not where a stray file was put', () => {
    const items = [
      { path: `${CURB}/a.mkv`, seriesId: 'curb' },
      { path: `${CURB}/b.mkv`, seriesId: 'curb' },
      { path: '/media/shows/Elsewhere/c.mkv', seriesId: 'curb' },
    ];

    const foldersByPath = new Map([
      [`${CURB}/a.mkv`, CURB],
      [`${CURB}/b.mkv`, CURB],
      ['/media/shows/Elsewhere/c.mkv', '/media/shows/Elsewhere'],
    ]);

    const grouped = groupSeriesByFolder(items, foldersByPath);

    expect(grouped.get(CURB)).toEqual(['curb']);
    expect(grouped.has('/media/shows/Elsewhere')).toBe(false);
  });

  it('ignores a file that belongs to no programme', () => {
    const items = [{ path: '/media/films/Arrival (2016).mkv', seriesId: null }];

    const foldersByPath = new Map([
      ['/media/films/Arrival (2016).mkv', '/media/films/Arrival (2016)'],
    ]);

    expect(groupSeriesByFolder(items, foldersByPath).size).toBe(0);
  });

  it('ignores a file the scan could not place under any folder', () => {
    const items = [{ path: '/media/shows/loose.mkv', seriesId: 'loose' }];

    expect(groupSeriesByFolder(items, new Map()).size).toBe(0);
  });
});
