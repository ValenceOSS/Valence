import { theKindOfTv } from '@ValenceTv/platform/theKindOfTv';
import { whichTv } from '@ValenceTv/native/whichTv';

describe('theKindOfTv', () => {
  it('names an Apple TV, an Android TV and a Fire TV', () => {
    expect(theKindOfTv('appleTv')).toBe('Apple TV');
    expect(theKindOfTv('androidTv')).toBe('Android TV');
    expect(theKindOfTv('fireTv')).toBe('Fire TV');
  });

  it('names the televisions whose browsers show the TV layout', () => {
    expect(theKindOfTv('lgTv')).toBe('LG TV');
    expect(theKindOfTv('samsungTv')).toBe('Samsung TV');
    expect(theKindOfTv('smartTv')).toBe('Smart TV');
  });

  it('names the television it runs on', () => {
    expect(theKindOfTv()).toBe(theKindOfTv(whichTv()));
  });
});
