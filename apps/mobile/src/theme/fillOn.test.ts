import { fillOn } from './fillOn';

describe('fillOn', () => {
  it('lightens what sits on near black', () => {
    expect(fillOn('#0f0f0f')).toBe('rgba(255, 255, 255, 0.14)');
  });

  it('darkens what sits on a colour of its own', () => {
    expect(fillOn('rgb(30, 90, 120)')).toBe('rgba(0, 0, 0, 0.32)');
  });
});
