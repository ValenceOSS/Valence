import { describe, expect, it } from 'vitest';
import { mapSourcePath } from './mapSourcePath';

describe('mapSourcePath', () => {
  it('moves a path by the longest mapping that holds it', () => {
    const mappings = [
      { from: '/data', to: '/media' },
      { from: '/data/movies/', to: '/films' },
    ];

    expect(mapSourcePath('/data/movies/Heat.mkv', mappings)).toBe('/films/Heat.mkv');
    expect(mapSourcePath('/data/tv/x.mkv', mappings)).toBe('/media/tv/x.mkv');
    expect(mapSourcePath('/data/movies', mappings)).toBe('/films');
  });

  it('does not move a folder that only starts with the same letters', () => {
    expect(mapSourcePath('/database/x', [{ from: '/data', to: '/media' }])).toBe('/database/x');
  });

  it('moves a Windows path', () => {
    expect(
      mapSourcePath('D:\\Media\\Movies\\Alien.mkv', [{ from: 'D:\\Media', to: '/media' }]),
    ).toBe('/media/Movies/Alien.mkv');
  });

  it('leaves a path no mapping holds, and the root as it was', () => {
    expect(mapSourcePath('/elsewhere/x', [])).toBe('/elsewhere/x');
    expect(mapSourcePath('/', [])).toBe('/');
  });
});
