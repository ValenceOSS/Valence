import { describe, expect, it } from 'vitest';
import { frownsAt } from './frownsAt';

describe('frownsAt', () => {
  it('keeps the frowns hidden until the deck is half open', () => {
    expect(frownsAt(0)).toBe(0);
    expect(frownsAt(0.5)).toBe(0);
  });

  it('fades them in to full by nine-tenths open', () => {
    expect(frownsAt(0.7)).toBeCloseTo(0.5);
    expect(frownsAt(0.9)).toBeCloseTo(1);
    expect(frownsAt(1)).toBe(1);
  });
});
