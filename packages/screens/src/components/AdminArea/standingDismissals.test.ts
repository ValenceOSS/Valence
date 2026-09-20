import { describe, expect, it } from 'vitest';
import { standingDismissals } from './standingDismissals';

describe('standingDismissals', () => {
  it('keeps the dismissals of concerns that still stand, and forgets the rest', () => {
    expect(
      standingDismissals(
        [
          'requests-indexers:The indexer 1337x keeps failing',
          'disk:The library disk is nearly full',
        ],
        [{ id: 'disk', title: 'The library disk is nearly full' }],
      ),
    ).toEqual(['disk:The library disk is nearly full']);
  });
});
