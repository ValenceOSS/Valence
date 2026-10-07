import { directionOfKey } from '@ValenceTv/focus/directionOfKey';

describe('directionOfKey', () => {
  it('reads the arrows as the way the remote moves', () => {
    expect(directionOfKey('ArrowUp')).toBe('up');
    expect(directionOfKey('ArrowRight')).toBe('right');
  });

  it('says nothing for another key', () => {
    expect(directionOfKey('Enter')).toBeNull();
  });
});
