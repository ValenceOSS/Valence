import { describe, expect, it } from 'vitest';
import { AccountProviderSchema } from './AccountProviderSchema';

const provider = {
  id: 'spotify',
  name: 'Spotify',
  authorizeUrl: 'https://accounts.spotify.com/authorize',
  tokenUrl: 'https://accounts.spotify.com/api/token',
  scopes: ['playlist-read-private'],
  clientIdSetting: 'spotifyClientId',
};

describe('AccountProviderSchema', () => {
  it('accepts a provider with a client id setting', () => {
    expect(AccountProviderSchema.parse(provider).id).toBe('spotify');
  });

  it('refuses an insecure token address and a malformed setting name', () => {
    expect(
      AccountProviderSchema.safeParse({
        ...provider,
        tokenUrl: 'http://accounts.spotify.com/api/token',
      }).success,
    ).toBe(false);
    expect(
      AccountProviderSchema.safeParse({ ...provider, clientIdSetting: 'Client-Id' }).success,
    ).toBe(false);
  });
});
