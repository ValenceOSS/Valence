import { nativeTagOf } from '@ValenceTv/navigation/nativeTagOf';

describe('nativeTagOf in a browser', () => {
  it('has no number for a view, a browser having no native views', () => {
    expect(nativeTagOf(null)).toBeNull();
  });
});
