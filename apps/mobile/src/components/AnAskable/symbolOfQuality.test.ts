import { symbolOfQuality } from './symbolOfQuality';

describe('symbolOfQuality', () => {
  it('draws 4K as a 4K television', () => {
    expect(symbolOfQuality('4K')).toBe('4k.tv');
    expect(symbolOfQuality('UHD 2160p')).toBe('4k.tv');
  });

  it('draws a sharp picture as a television', () => {
    expect(symbolOfQuality('1080p')).toBe('tv');
    expect(symbolOfQuality('1080p or 720p')).toBe('tv');
  });

  it('draws a smaller picture as a small screen', () => {
    expect(symbolOfQuality('SD')).toBe('iphone');
  });

  it('draws anything else as a stack', () => {
    expect(symbolOfQuality('Any')).toBe('square.stack');
  });
});
