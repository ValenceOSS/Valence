import { describe, expect, it } from 'vitest';
import { tintOf } from './tintOf';

describe('tintOf', () => {
  it('washes a hex colour out to the opacity asked for', () => {
    expect(tintOf('#F1C40F', 0.18)).toBe('rgba(241, 196, 15, 0.18)');
  });

  it('hands back anything that is not a six-digit hex code as it is', () => {
    expect(tintOf('tomato', 0.18)).toBe('tomato');
  });
});
