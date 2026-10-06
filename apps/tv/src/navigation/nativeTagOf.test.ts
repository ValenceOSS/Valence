import { nativeTagOf } from '@ValenceTv/navigation/nativeTagOf';

describe('nativeTagOf', () => {
  it('has no number for no view', () => {
    expect(nativeTagOf(null)).toBeNull();
  });
});
