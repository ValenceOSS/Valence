import { describe, expect, it } from 'vitest';
import { HostnameSchema } from './HostnameSchema';

describe('HostnameSchema', () => {
  it.each(['api.spotify.com', 'graphql.anilist.co', 'a-b.example.org'])('accepts %s', (host) => {
    expect(HostnameSchema.safeParse(host).success).toBe(true);
  });

  it.each([
    'localhost',
    'https://api.spotify.com',
    'api.spotify.com:443',
    'api.spotify.com/v1',
    '*.spotify.com',
    'API.Spotify.com',
    '-bad.example.com',
    'bad-.example.com',
  ])('refuses %s', (host) => {
    expect(HostnameSchema.safeParse(host).success).toBe(false);
  });
});
