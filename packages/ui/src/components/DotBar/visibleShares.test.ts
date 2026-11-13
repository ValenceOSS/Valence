import { describe, expect, it } from 'vitest';
import { visibleShares } from './visibleShares';

describe('visibleShares', () => {
  it('leaves parts alone where every one is wide enough to see', () => {
    expect(visibleShares([0.5, 0.3, 0.2], 0.05)).toEqual([0.5, 0.3, 0.2]);
  });

  it('widens a part too small to see, and narrows the rest to make room', () => {
    const drawn = visibleShares([0.99, 0.01], 0.05);

    expect(drawn[1]).toBeCloseTo(0.05);
    expect(drawn[0]).toBeCloseTo(0.95);
  });

  it('keeps the parts it narrows in proportion to one another', () => {
    const drawn = visibleShares([0.6, 0.39, 0.01], 0.05);

    expect((drawn[0] ?? 0) / (drawn[1] ?? 1)).toBeCloseTo(0.6 / 0.39);
  });

  it('still fills the whole', () => {
    const drawn = visibleShares([0.9, 0.06, 0.03, 0.01], 0.05);

    expect(drawn.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1);
  });

  it('draws nothing for a part with nothing in it', () => {
    expect(visibleShares([1, 0], 0.05)).toEqual([1, 0]);
  });
});
