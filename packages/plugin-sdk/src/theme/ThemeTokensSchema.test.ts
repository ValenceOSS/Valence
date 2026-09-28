import { describe, expect, it } from 'vitest';
import { aTheme } from '@ValenceSDK/testing/aTheme';
import { ThemeTokensSchema } from './ThemeTokensSchema';

describe('ThemeTokensSchema', () => {
  it('accepts every token and refuses a missing or extra one', () => {
    expect(ThemeTokensSchema.parse(aTheme())).toEqual(aTheme());
    expect(ThemeTokensSchema.safeParse({ ...aTheme(), accent: undefined }).success).toBe(false);
    expect(ThemeTokensSchema.parse({ ...aTheme(), fontFamily: 'Comic Sans' })).not.toHaveProperty('fontFamily');
  });
});
