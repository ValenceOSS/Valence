import { describe, expect, it } from 'vitest';
import { mapArrPath } from './mapArrPath';

describe('mapArrPath', () => {
  it('writes a path as Valence sees it through the longest mapping it starts with', () => {
    const mappings = [
      { from: '/data', to: '/mnt/data' },
      { from: '/data/movies/', to: '/media/Films' },
    ];

    expect(mapArrPath('/data/movies/Dune (2021)', mappings)).toBe('/media/Films/Dune (2021)');
    expect(mapArrPath('/data/downloads/', mappings)).toBe('/mnt/data/downloads');
    expect(mapArrPath('/data/movies', mappings)).toBe('/media/Films');
  });

  it('leaves a path no mapping covers, and does not take a near miss for a match', () => {
    expect(mapArrPath('/datastore/x', [{ from: '/data', to: '/mnt' }])).toBe('/datastore/x');
  });

  it('reads Windows paths with their slashes turned', () => {
    expect(mapArrPath('D:\\Movies\\Dune', [{ from: 'D:/Movies', to: '/media/Films' }])).toBe(
      '/media/Films/Dune',
    );
  });

  it('maps everything under a mapping from the root', () => {
    expect(mapArrPath('/tv/Severance', [{ from: '/', to: '/mnt/arr' }])).toBe(
      '/mnt/arr/tv/Severance',
    );
  });
});
