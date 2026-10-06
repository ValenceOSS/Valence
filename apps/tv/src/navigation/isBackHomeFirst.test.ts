import { isBackHomeFirst } from '@ValenceTv/navigation/isBackHomeFirst';

describe('isBackHomeFirst', () => {
  it('goes Home from any other part of the bar on Android TV', () => {
    expect(isBackHomeFirst('films', 'android')).toBe(true);
    expect(isBackHomeFirst('account', 'android')).toBe(true);
  });

  it('leaves from Home on Android TV', () => {
    expect(isBackHomeFirst('home', 'android')).toBe(false);
  });

  it('leaves from any part on an Apple TV', () => {
    expect(isBackHomeFirst('films', 'ios')).toBe(false);
  });
});
