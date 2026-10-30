import { describe, expect, it } from 'vitest';
import { isDarkGround } from './isDarkGround';

describe('isDarkGround', () => {
  it('counts near black as dark', () => {
    expect(isDarkGround('#0f0f0f')).toBe(true);
  });

  it('does not count a colour of its own as dark', () => {
    expect(isDarkGround('rgb(30, 90, 120)')).toBe(false);
  });

  it('counts a colour it cannot read as dark', () => {
    expect(isDarkGround('tomato')).toBe(true);
  });
});
