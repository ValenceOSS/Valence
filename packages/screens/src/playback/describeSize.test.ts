import { describe, expect, it } from 'vitest';
import { describeSize } from './describeSize';

describe('describeSize', () => {
  it('writes a size as width by height', () => {
    expect(describeSize(1920, 1080)).toBe('1920×1080');
  });

  it('says nothing where the size is not known yet', () => {
    expect(describeSize(null, 1080)).toBeNull();
    expect(describeSize(1920, null)).toBeNull();
    expect(describeSize(0, 0)).toBeNull();
  });
});
