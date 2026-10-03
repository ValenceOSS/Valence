import { describe, expect, it } from 'vitest';
import { sizeOf } from './sizeOf';

describe('sizeOf', () => {
  it('reads a size, trimmed', () => {
    expect(sizeOf(' 800 ')).toBe(800);
    expect(sizeOf('0')).toBe(0);
  });

  it('answers none where nothing was typed', () => {
    expect(sizeOf('  ')).toBeNull();
  });

  it('answers that it is not a size where it cannot be one', () => {
    expect(sizeOf('lots')).toBeUndefined();
    expect(sizeOf('-1')).toBeUndefined();
  });
});
