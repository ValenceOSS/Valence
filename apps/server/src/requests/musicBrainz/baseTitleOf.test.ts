import { describe, expect, it } from 'vitest';
import { baseTitleOf } from './baseTitleOf';

describe('baseTitleOf', () => {
  it('takes off what an edition adds', () => {
    expect(baseTitleOf('Isles (Deluxe)')).toBe('Isles');
    expect(baseTitleOf('Isles [Bonus Tracks]')).toBe('Isles');
    expect(baseTitleOf('Isles - 2021 Remaster')).toBe('Isles');
  });

  it('leaves a title with no edition alone', () => {
    expect(baseTitleOf(' Nebulous Nights ')).toBe('Nebulous Nights');
  });

  it('keeps a title that is nothing but brackets', () => {
    expect(baseTitleOf('(What)')).toBe('(What)');
  });
});
