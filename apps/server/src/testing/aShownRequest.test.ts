import { describe, expect, it } from 'vitest';
import { aShownRequest } from '@ValenceServer/testing/aShownRequest';

describe('aShownRequest', () => {
  it('is an approved film request waiting on one item, with what a test changes', () => {
    expect(aShownRequest()).toMatchObject({ kind: 'film', approval: 'approved', mediaId: null });
    expect(aShownRequest().items).toHaveLength(1);
    expect(aShownRequest({ mediaId: 'dune' }).mediaId).toBe('dune');
  });
});
