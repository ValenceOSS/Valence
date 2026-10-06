import { theKindOfTv } from '@ValenceTv/platform/theKindOfTv';
import { whichTv } from '@ValenceTv/native/whichTv';

describe('theKindOfTv', () => {
  it('names an Apple TV, an Android TV and a Fire TV', () => {
    expect(theKindOfTv('appleTv')).toBe('Apple TV');
    expect(theKindOfTv('androidTv')).toBe('Android TV');
    expect(theKindOfTv('fireTv')).toBe('Fire TV');
  });

  it('names the television it runs on', () => {
    expect(theKindOfTv()).toBe(theKindOfTv(whichTv()));
  });
});
