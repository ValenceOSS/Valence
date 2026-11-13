import { describe, expect, it } from 'vitest';
import { CROPS } from './CROPS';

describe('CROPS', () => {
  it('keeps a face small and artwork large enough for a large screen', () => {
    expect(CROPS.face.longestEdge).toBeLessThan(CROPS.cover.longestEdge);
    expect(CROPS.backdrop.longestEdge).toBeGreaterThanOrEqual(3840);
  });
});
