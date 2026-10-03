import { describe, expect, it } from 'vitest';
import { applyRoundness } from './applyRoundness';

describe('applyRoundness', () => {
  it('writes the scale of the level onto the element', () => {
    const root = document.createElement('div');

    applyRoundness('round', root);

    expect(root.style.getPropertyValue('--radius-scale')).toBe('2.2');
  });

  it('writes no rounding at all for the sharpest level', () => {
    const root = document.createElement('div');

    applyRoundness('sharp', root);

    expect(root.style.getPropertyValue('--radius-scale')).toBe('0');
  });

  it('writes the stock scale for the default level', () => {
    const root = document.createElement('div');

    applyRoundness('default', root);

    expect(root.style.getPropertyValue('--radius-scale')).toBe('1.6');
  });
});
