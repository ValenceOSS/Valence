import { describe, expect, it } from 'vitest';
import { sayRatingMeans } from './sayRatingMeans';

describe('sayRatingMeans', () => {
  it('says what a British rating means', () => {
    expect(sayRatingMeans('GB', '12A')).toBe('For ages 12 and up, or younger with an adult');
    expect(sayRatingMeans('GB', '18')).toBe('For adults only');
  });

  it('says what an American film or television rating means', () => {
    expect(sayRatingMeans('US', 'PG-13')).toBe('Some of it may not suit children under 13');
    expect(sayRatingMeans('US', 'TV-MA')).toBe('For adults only');
  });

  it('reads the rating and region whatever their case or spacing', () => {
    expect(sayRatingMeans('gb', ' u ')).toBe('Fine for all ages');
  });

  it('says nothing for a rating from elsewhere or none at all', () => {
    expect(sayRatingMeans('DE', 'FSK 12')).toBeNull();
    expect(sayRatingMeans(null, '15')).toBeNull();
    expect(sayRatingMeans('GB', null)).toBeNull();
  });
});
