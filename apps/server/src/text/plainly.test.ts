import { describe, expect, it } from 'vitest';
import { plainly } from './plainly';

describe('plainly', () => {
  it('drops case, punctuation and what is in brackets', () => {
    expect(plainly('Her Loss (Deluxe) [Explicit]')).toBe('her loss');
    expect(plainly('Rent-A-Girlfriend!')).toBe('rent a girlfriend');
  });

  it('keeps letters in any script', () => {
    expect(plainly('彼女、お借りします')).toBe('彼女 お借りします');
  });
});
