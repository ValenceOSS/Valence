import { describe, expect, it } from 'vitest';
import { colourOf } from './colourOf';

describe('colourOf', () => {
  it('gives a name the same colour every time', () => {
    expect(colourOf('Some Album')).toBe(colourOf('Some Album'));
  });

  it('gives different names different colours', () => {
    const colours = new Set(['One', 'Two', 'Three', 'Four', 'Five'].map(colourOf));

    expect(colours.size).toBeGreaterThan(3);
  });

  it('writes six hexadecimal digits', () => {
    expect(colourOf('Anything at all')).toMatch(/^[0-9a-f]{6}$/u);
  });
});
