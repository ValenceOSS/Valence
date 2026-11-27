import { describe, expect, it } from 'vitest';
import { ProfileNewsSchema } from '@ValenceClient/query/ProfileNewsSchema';

describe('ProfileNewsSchema', () => {
  it('reads news that what a profile keeps has changed', () => {
    expect(ProfileNewsSchema.safeParse({ event: 'favourites' }).success).toBe(true);
  });

  it('reads nothing from any other news of a profile', () => {
    expect(ProfileNewsSchema.safeParse({ changed: true }).success).toBe(false);
    expect(ProfileNewsSchema.safeParse({ event: 'renamed' }).success).toBe(false);
    expect(ProfileNewsSchema.safeParse(null).success).toBe(false);
  });
});
