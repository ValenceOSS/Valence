import { describe, expect, it } from 'vitest';
import { SITE_ADDRESSES } from './SITE_ADDRESSES';

describe('SITE_ADDRESSES', () => {
  it('names where each of Valence’s sites lives', () => {
    expect(SITE_ADDRESSES).toStrictEqual({
      landing: 'https://getvalence.app',
      docs: 'https://docs.getvalence.app',
      metrics: 'https://metrics.getvalence.app',
    });
  });
});
