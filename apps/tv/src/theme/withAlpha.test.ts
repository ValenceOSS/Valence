import { withAlpha } from '@ValenceTv/theme/withAlpha';

describe('withAlpha', () => {
  it('makes an rgba colour as opaque as asked', () => {
    expect(withAlpha('rgba(58, 142, 232, 1)', 0.15)).toBe('rgba(58, 142, 232, 0.15)');
  });

  it('reads an rgba colour written without spaces', () => {
    expect(withAlpha('rgba(1,2,3,0.5)', 1)).toBe('rgba(1, 2, 3, 1)');
  });

  it('leaves a colour that is not rgba as it was', () => {
    expect(withAlpha('#3a8ee8', 0.5)).toBe('#3a8ee8');
  });
});
