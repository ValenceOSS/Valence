import { describe, expect, it } from 'vitest';
import { AdvisorySchema, ContentAdviceSchema } from './Advisory';

describe('AdvisorySchema', () => {
  it('reads what a title can contain, and nothing else', () => {
    expect(AdvisorySchema.parse('violence')).toBe('violence');
    expect(AdvisorySchema.safeParse('scary music').success).toBe(false);
  });
});

describe('ContentAdviceSchema', () => {
  it('reads what a title contains, country by country', () => {
    expect(ContentAdviceSchema.parse({ GB: ['violence', 'language'] })).toEqual({
      GB: ['violence', 'language'],
    });
  });
});
