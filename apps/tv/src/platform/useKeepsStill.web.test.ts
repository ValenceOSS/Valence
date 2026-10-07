import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';

describe('useKeepsStill in a browser', () => {
  it('always keeps still, since a television’s browser animates in JavaScript', () => {
    expect(useKeepsStill()).toBe(true);
  });
});
