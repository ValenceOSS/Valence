import { fillTheGaps } from '@ValenceTv/platform/fillTheGaps';

describe('fillTheGaps in a browser', () => {
  it('fills in the built-ins a television’s browser can lack as it loads', () => {
    expect(fillTheGaps()).toBeUndefined();
    expect(typeof URL.parse).toBe('function');
    expect(typeof Array.prototype.findLast).toBe('function');
  });
});
