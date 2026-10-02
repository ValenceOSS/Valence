import { describe, expect, it } from 'vitest';
import { ageOfRating } from './ageOfRating';

describe('ageOfRating', () => {
  it('reads a rating in the first region that knows it', () => {
    expect(ageOfRating('PG-13', ['GB', 'US'])).toBe(13);
    expect(ageOfRating('12A', ['US', 'GB'])).toBe(12);
  });

  it('reads a country prefix first', () => {
    expect(ageOfRating('gb/15', ['US'])).toBe(15);
  });

  it('has nothing for a rating nobody knows', () => {
    expect(ageOfRating('Approved', ['US', 'GB'])).toBeNull();
  });
});
