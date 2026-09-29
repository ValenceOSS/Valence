import { describe, expect, it } from 'vitest';
import { describePermission } from './describePermission';

describe('describePermission', () => {
  it('says each permission in plain words', () => {
    expect(
      describePermission({ kind: 'network', hosts: ['api.spotify.com', 'accounts.spotify.com'] }),
    ).toBe('Talks to api.spotify.com and accounts.spotify.com');
    expect(describePermission({ kind: 'library', access: 'read' })).toBe('Reads your library');
    expect(describePermission({ kind: 'viewing', access: 'read' })).toBe(
      'Reads what you have watched',
    );
    expect(describePermission({ kind: 'viewing', access: 'write' })).toBe(
      'Reads and updates what you have watched',
    );
    expect(describePermission({ kind: 'requests', access: 'create' })).toBe(
      'Asks for titles you do not have yet',
    );
    expect(describePermission({ kind: 'playlists', access: 'read' })).toBe('Reads your playlists');
    expect(describePermission({ kind: 'playlists', access: 'write' })).toBe(
      'Creates and fills playlists',
    );
    expect(describePermission({ kind: 'notifications' })).toBe('Sends you notifications');
  });

  it('rounds storage to whole megabytes, never below one', () => {
    expect(describePermission({ kind: 'storage', quotaBytes: 5_000_000 })).toBe(
      'Keeps up to 5 MB of its own data',
    );
    expect(describePermission({ kind: 'storage', quotaBytes: 1000 })).toBe(
      'Keeps up to 1 MB of its own data',
    );
  });

  it('names the accounts it connects to', () => {
    expect(
      describePermission({
        kind: 'accounts',
        providers: [
          {
            id: 'anilist',
            name: 'AniList',
            authorizeUrl: 'https://anilist.co/api/v2/oauth/authorize',
            tokenUrl: 'https://anilist.co/api/v2/oauth/token',
            scopes: [],
            clientIdSetting: 'anilistClientId',
          },
          {
            id: 'mal',
            name: 'MyAnimeList',
            authorizeUrl: 'https://myanimelist.net/v1/oauth2/authorize',
            tokenUrl: 'https://myanimelist.net/v1/oauth2/token',
            scopes: [],
            clientIdSetting: 'malClientId',
          },
        ],
      }),
    ).toBe('Connects to your AniList and MyAnimeList account');
  });
});
