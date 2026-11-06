import { describe, expect, it } from 'vitest';
import { describeRatingAge } from './describeRatingAge';

describe('describeRatingAge', () => {
  it('says what age a rating is for', () => {
    expect(describeRatingAge('GB', '12A')).toBe('For 12 and over');
    expect(describeRatingAge('US', 'G')).toBe('For everyone');
    expect(describeRatingAge('DE', '16')).toBe('For 16 and over');
  });

  it('says nothing of a rating whose age cannot be told', () => {
    expect(describeRatingAge('US', 'NR')).toBeNull();
    expect(describeRatingAge('GB', '')).toBeNull();
  });
});
