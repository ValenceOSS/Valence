import { describeThisTv } from '@ValenceTv/platform/describeThisTv';

describe('describeThisTv', () => {
  it('uses the name somebody gave the television', () => {
    expect(describeThisTv('  Living Room ')).toBe('Living Room');
  });

  it('calls it an Apple TV where it has no name', () => {
    expect(describeThisTv(null)).toBe('Apple TV');
    expect(describeThisTv('   ')).toBe('Apple TV');
  });
});
