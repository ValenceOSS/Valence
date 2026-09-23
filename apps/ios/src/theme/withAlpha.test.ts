import { withAlpha } from './withAlpha';

describe('withAlpha', () => {
  it('sees through a colour written in six hex digits', () => {
    expect(withAlpha('#0e0e0e', 0.5)).toBe('rgba(14, 14, 14, 0.5)');
  });

  it('reads the short hex form and rgb alike', () => {
    expect(withAlpha('#fff', 1)).toBe('rgba(255, 255, 255, 1)');
    expect(withAlpha('rgb(56 68 150)', 0.2)).toBe('rgba(56, 68, 150, 0.2)');
  });

  it('keeps how see-through it is between nothing and everything', () => {
    expect(withAlpha('#000000', 2)).toBe('rgba(0, 0, 0, 1)');
    expect(withAlpha('#000000', -1)).toBe('rgba(0, 0, 0, 0)');
  });

  it('draws nothing for a colour it cannot read', () => {
    expect(withAlpha('papayawhip', 0.5)).toBe('transparent');
  });
});
