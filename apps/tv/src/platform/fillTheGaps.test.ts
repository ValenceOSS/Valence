import { fillTheGaps } from '@ValenceTv/platform/fillTheGaps';

describe('fillTheGaps', () => {
  it('has nothing to fill in on tvOS or Android TV', () => {
    expect(fillTheGaps()).toBeUndefined();
  });
});
