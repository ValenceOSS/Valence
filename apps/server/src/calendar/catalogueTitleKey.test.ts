import { describe, expect, it } from 'vitest';
import { catalogueTitleKey } from './catalogueTitleKey';

describe('catalogueTitleKey', () => {
  it('tells a film from a series with the same number', () => {
    expect(catalogueTitleKey({ kind: 'movie', externalId: '42' })).toBe('movie:42');
    expect(catalogueTitleKey({ kind: 'tv', externalId: '42' })).toBe('tv:42');
  });
});
