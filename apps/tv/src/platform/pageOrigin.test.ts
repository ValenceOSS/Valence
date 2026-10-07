import { pageOrigin } from '@ValenceTv/platform/pageOrigin';

describe('pageOrigin', () => {
  it('has no page to come from on tvOS or Android TV', () => {
    expect(pageOrigin()).toBeNull();
  });
});
