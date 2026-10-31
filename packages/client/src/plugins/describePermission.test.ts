import { describe, expect, it } from 'vitest';
import { describePermission } from './describePermission';

describe('describePermission', () => {
  it('says whether a plugin answers only signed-in apps or anybody at all', () => {
    expect(describePermission({ kind: 'routes', public: false }).title).toBe(
      'Answer apps outside Valence',
    );
    expect(describePermission({ kind: 'routes', public: true }).title).toBe(
      'Answer anybody outside Valence',
    );
  });

  it('tells reading every library apart from reading what each person may see', () => {
    expect(describePermission({ kind: 'library', access: 'everything' })).toEqual({
      title: 'Read every library',
      detail:
        'See everything in every library, including locked libraries and titles past a person’s age limit. It can’t change or delete them.',
    });
  });

  it('says plainly when a plugin hears everybody on the server', () => {
    expect(describePermission({ kind: 'viewing', access: 'read', household: true })).toEqual({
      title: 'See what everybody watches',
      detail:
        'Hear whenever anybody on this server starts, pauses or stops watching or listening, or opens or leaves Valence, even people who never use the plugin, and read their watch history, favourites and ratings while it does.',
    });
    expect(describePermission({ kind: 'viewing', access: 'write', household: true }).title).toBe(
      'Change what everybody has watched',
    );
  });

  it('says what each permission lets a plugin do', () => {
    const said = [
      describePermission({ kind: 'network', hosts: ['graphql.anilist.co', 'anilist.co'] }),
      describePermission({ kind: 'library', access: 'read' }),
      describePermission({ kind: 'viewing', access: 'read' }),
      describePermission({ kind: 'viewing', access: 'write' }),
      describePermission({ kind: 'requests', access: 'create' }),
      describePermission({ kind: 'playlists', access: 'read' }),
      describePermission({ kind: 'playlists', access: 'write' }),
      describePermission({ kind: 'storage', quotaBytes: 5_000_000 }),
      describePermission({
        kind: 'accounts',
        providers: [
          {
            id: 'anilist',
            name: 'AniList',
            authorizeUrl: 'https://anilist.co/api/v2/oauth/authorize',
            tokenUrl: 'https://anilist.co/api/v2/oauth/token',
            scopes: [],
            clientIdSetting: 'clientId',
          },
        ],
      }),
      describePermission({ kind: 'notifications' }),
    ];

    expect(said.map((one) => one.title)).toEqual([
      'Connect to other websites',
      'Read your library',
      'View watch history',
      'Change watch history',
      'Make requests',
      'View playlists',
      'Create and edit playlists',
      'Store its own data',
      'Connect to external accounts',
      'Send notifications',
    ]);
    expect(said[0]?.detail).toContain('graphql.anilist.co, anilist.co');
    expect(said[7]?.detail).toContain('5 MB');
    expect(said[8]?.detail).toContain('AniList');
  });

  it('says which hosts a plugin hands over files from, patterns and all', () => {
    expect(describePermission({ kind: 'links', hosts: ['*.files.example.com'] })).toEqual({
      title: 'Fetch files from other websites',
      detail:
        'Only *.files.example.com, over HTTPS. This server fetches files from there to play or import them.',
    });
  });
});
