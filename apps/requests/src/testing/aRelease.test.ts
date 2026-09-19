import { describe, expect, it } from 'vitest';
import { aRelease } from './aRelease';

describe('aRelease', () => {
  it('makes a seeded torrent of the name given, with a link to fetch it by, with what was changed', () => {
    expect(aRelease('Dune', { seeders: 0 })).toMatchObject({
      id: 'Dune',
      title: 'Dune',
      protocol: 'torrent',
      seeders: 0,
    });
  });
});
