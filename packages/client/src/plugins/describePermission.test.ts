import { describe, expect, it } from 'vitest';
import { describePermission } from './describePermission';

describe('describePermission', () => {
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
      'Talk to other websites',
      'Read your library',
      'See what people have watched',
      'Change what people have watched',
      'Ask for new titles',
      'See playlists',
      'Make and change playlists',
      'Keep its own notes',
      'Connect to other accounts',
      'Send notifications',
    ]);
    expect(said[0]?.detail).toContain('graphql.anilist.co, anilist.co');
    expect(said[7]?.detail).toContain('5 MB');
    expect(said[8]?.detail).toContain('AniList');
  });
});
