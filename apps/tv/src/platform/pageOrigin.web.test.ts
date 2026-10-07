import { pageOrigin } from '@ValenceTv/platform/pageOrigin';

describe('pageOrigin in a browser', () => {
  it('is the origin of the page, which is the Valence that served it', () => {
    expect(pageOrigin()).toBe(window.location.origin);
  });
});
