import { describe, expect, it } from 'vitest';
import {
  InviteContentsSchema,
  LinkAddressSchema,
  LinkIdentityChangeSchema,
  UseLinkInviteSchema,
} from './LinkedServer';

describe('LinkedServer', () => {
  it('takes an address on the web, without a slash at its end', () => {
    expect(LinkAddressSchema.parse('https://anime.example/')).toBe('https://anime.example');
    expect(LinkAddressSchema.safeParse('ftp://anime.example').success).toBe(false);
    expect(LinkAddressSchema.safeParse('not an address').success).toBe(false);
  });

  it('reads an invite’s contents, and only its first version', () => {
    const contents = {
      v: 1,
      address: 'https://anime.example',
      code: 'x'.repeat(20),
      fingerprint: 'abcd',
    };

    expect(InviteContentsSchema.parse(contents)).toEqual(contents);
    expect(InviteContentsSchema.safeParse({ ...contents, v: 2 }).success).toBe(false);
  });

  it('takes only what looks like an invite', () => {
    expect(UseLinkInviteSchema.safeParse({ invite: ' valence-link:abc ' }).success).toBe(true);
    expect(UseLinkInviteSchema.safeParse({ invite: 'https://example.com' }).success).toBe(false);
  });

  it('trims a new name and refuses an empty one', () => {
    expect(LinkIdentityChangeSchema.parse({ name: '  Anime  ' }).name).toBe('Anime');
    expect(LinkIdentityChangeSchema.safeParse({ name: '   ' }).success).toBe(false);
  });
});
