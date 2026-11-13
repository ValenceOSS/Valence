import { describe, expect, it } from 'vitest';
import { hexOfHsv } from './hexOfHsv';

describe('hexOfHsv', () => {
  it('writes a hue, saturation and brightness as a colour', () => {
    expect(hexOfHsv(0, 1, 1)).toBe('#ff0000');
    expect(hexOfHsv(120, 1, 1)).toBe('#00ff00');
    expect(hexOfHsv(0, 0, 1)).toBe('#ffffff');
    expect(hexOfHsv(0, 0, 0)).toBe('#000000');
  });
});
