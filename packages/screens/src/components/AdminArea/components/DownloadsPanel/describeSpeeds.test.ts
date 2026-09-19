import { describe, expect, it } from 'vitest';
import { describeSpeeds } from './describeSpeeds';

describe('describeSpeeds', () => {
  it('says both directions, or the one that is known', () => {
    expect(describeSpeeds(1_258_291, 40_960)).toBe('↓ 1.2 MB/s · ↑ 40 KB/s');
    expect(describeSpeeds(2048, null)).toBe('↓ 2.0 KB/s');
    expect(describeSpeeds(null, 0)).toBe('↑ 0 B/s');
  });

  it('says nothing where neither is known', () => {
    expect(describeSpeeds(null, null)).toBeNull();
  });
});
