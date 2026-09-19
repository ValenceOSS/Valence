import { describe, expect, it } from 'vitest';
import { mapClientPath } from './mapClientPath';

const MAPPED = { remotePath: '/downloads', localPath: '/Users/marques/Downloads/Valence' };

describe('mapClientPath', () => {
  it('swaps the client’s name for the folder for this service’s', () => {
    expect(mapClientPath('/downloads/valence-films/Dune', MAPPED)).toBe(
      '/Users/marques/Downloads/Valence/valence-films/Dune',
    );
    expect(mapClientPath('/downloads', MAPPED)).toBe('/Users/marques/Downloads/Valence');
    expect(mapClientPath('/', { remotePath: '/', localPath: '/data' })).toBe('/data');
    expect(mapClientPath('/films/Dune', { remotePath: '/', localPath: '/data' })).toBe(
      '/data/films/Dune',
    );
  });

  it('leaves a path alone that is elsewhere, or where nothing is set', () => {
    expect(mapClientPath('/downloadsElsewhere/Dune', MAPPED)).toBe('/downloadsElsewhere/Dune');
    expect(mapClientPath('/downloads/Dune', { remotePath: '', localPath: '' })).toBe(
      '/downloads/Dune',
    );
  });
});
