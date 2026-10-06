import { describeThisTv } from '@ValenceTv/platform/describeThisTv';
import { theKindOfTv } from '@ValenceTv/platform/theKindOfTv';

describe('describeThisTv', () => {
  it('uses the name somebody gave the television', () => {
    expect(describeThisTv('  Living Room ')).toBe('Living Room');
  });

  it('calls it by the kind of television it is where it has no name', () => {
    expect(describeThisTv(null)).toBe(theKindOfTv());
    expect(describeThisTv('   ')).toBe(theKindOfTv());
  });
});
