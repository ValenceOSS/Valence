import { describe, expect, it } from 'vitest';
import { placeIn } from '@ValenceClient/navigation/readLocation';
import { addressAfter } from './addressAfter';

describe('addressAfter', () => {
  it('keeps what a move within a page does not change', () => {
    const place = placeIn('/search', { q: 'blade' });

    expect(addressAfter(place, { inspecting: 'arrival' })).toContain('blade');
  });

  it('leaves behind what belonged to a page being left', () => {
    const place = placeIn('/search', { q: 'blade' });

    expect(addressAfter(place, { section: 'films' })).not.toContain('blade');
  });
});
