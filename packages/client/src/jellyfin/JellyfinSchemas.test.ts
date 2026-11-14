import { describe, expect, it } from 'vitest';
import { JellyfinItemSchema, JellyfinPublicInfoSchema } from './JellyfinSchemas';

describe('JellyfinSchemas', () => {
  it('reads an item with the nulls Jellyfin sends', () => {
    expect(
      JellyfinItemSchema.safeParse({
        Id: 'a',
        Type: 'Movie',
        Name: null,
        ProductionYear: null,
        UserData: null,
      }).success,
    ).toBe(true);
  });

  it('refuses what is not a server’s public information', () => {
    expect(JellyfinPublicInfoSchema.safeParse({ ServerName: 'x' }).success).toBe(false);
  });
});
