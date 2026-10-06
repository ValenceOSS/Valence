import { whichTv } from '@ValenceTv/native/whichTv';

describe('whichTv', () => {
  it('is an Apple TV on tvOS', () => {
    expect(whichTv('ios', { isFireTv: () => true })).toBe('appleTv');
  });

  it('is a Fire TV where Android has Amazon’s feature, and an Android TV otherwise', () => {
    expect(whichTv('android', { isFireTv: () => true })).toBe('fireTv');
    expect(whichTv('android', { isFireTv: () => false })).toBe('androidTv');
    expect(whichTv('android', null)).toBe('androidTv');
  });
});
