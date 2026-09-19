import { describe, expect, it } from 'vitest';
import { aRelease } from './aRelease';

describe('aRelease', () => {
  it('makes a seeded torrent of the name given, with what was changed', () => {
    expect(aRelease('Dune', { seeders: 0 })).toMatchObject({
      id: 'Dune',
      title: 'Dune',
      protocol: 'torrent',
      seeders: 0,
    });
  });
});
