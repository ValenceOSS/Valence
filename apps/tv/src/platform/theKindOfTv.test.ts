import { theKindOfTv } from '@ValenceTv/platform/theKindOfTv';

describe('theKindOfTv', () => {
  it('names an Apple TV and an Android TV', () => {
    expect(theKindOfTv('ios')).toBe('Apple TV');
    expect(theKindOfTv('android')).toBe('Android TV');
  });

  it('names the television it runs on', () => {
    expect(theKindOfTv()).toBe('Apple TV');
  });
});
