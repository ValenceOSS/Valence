import { describe, expect, it } from 'vitest';
import { summarisePermissions } from './summarisePermissions';

describe('summarisePermissions', () => {
  it('names each connected account and the things in Valence a plugin touches', () => {
    expect(
      summarisePermissions([
        { kind: 'network', hosts: ['graphql.anilist.co', 'anilist.co'] },
        {
          kind: 'accounts',
          providers: [
            {
              id: 'anilist',
              name: 'AniList',
              authorizeUrl: 'https://anilist.co/api/v2/oauth/authorize',
              tokenUrl: 'https://anilist.co/api/v2/oauth/token',
              scopes: [],
              clientIdSetting: 'anilistClientId',
              clientSecretSetting: 'anilistClientSecret',
            },
          ],
        },
        { kind: 'library', access: 'read' },
        { kind: 'viewing', access: 'write' },
      ]).map((summary) => summary.label),
    ).toEqual(['Your AniList account', 'Your library', 'Updates what you watched']);
  });

  it('says reading apart from writing', () => {
    expect(
      summarisePermissions([
        { kind: 'viewing', access: 'read' },
        { kind: 'playlists', access: 'read' },
        { kind: 'requests', access: 'create' },
      ]).map((summary) => summary.label),
    ).toEqual(['What you watched', 'Your playlists', 'Requests titles']);
  });

  it('leaves the plumbing nearly every plugin needs for the details', () => {
    expect(
      summarisePermissions([
        { kind: 'network', hosts: ['api.example.com'] },
        { kind: 'storage', quotaBytes: 1_000_000 },
        { kind: 'notifications' },
        { kind: 'webhooks' },
        { kind: 'emits' },
      ]),
    ).toEqual([]);
  });

  it('says a permission once, however many times the manifest gives it', () => {
    expect(
      summarisePermissions([
        { kind: 'library', access: 'read' },
        { kind: 'library', access: 'read' },
      ]),
    ).toEqual([{ id: 'library', kind: 'library', label: 'Your library' }]);
  });
});
