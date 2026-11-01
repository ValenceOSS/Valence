import { describe, expect, it } from 'vitest';
import type { RouteSignIn } from './RouteSignInSchema';
import { aManifest } from '@ValenceSDK/testing/aManifest';
import { PluginManifestSchema } from './PluginManifestSchema';
import type { PluginManifestInput } from './PluginManifestSchema';

const problemsOf = (input: Parameters<typeof PluginManifestSchema.safeParse>[0]): string[] => {
  const read = PluginManifestSchema.safeParse(input);

  return read.success ? [] : read.error.issues.map((issue) => issue.message);
};

describe('PluginManifestSchema', () => {
  it('accepts a complete manifest', () => {
    const manifest = PluginManifestSchema.parse(aManifest());

    expect(manifest.id).toBe('anime-tracker');
    expect(manifest.contributes.pages).toHaveLength(1);
  });

  it('fills in empty contributions, permissions and settings for a theme-only plugin', () => {
    const manifest = PluginManifestSchema.parse({
      ...aManifest(),
      permissions: undefined,
      contributes: undefined,
      entry: undefined,
      settings: undefined,
    });

    expect(manifest.permissions).toEqual([]);
    expect(manifest.contributes).toEqual({
      pages: [],
      panels: [],
      themes: [],
      schedules: [],
      events: [],
      webhooks: [],
      emits: [],
      downloadClients: [],
      sources: [],
      routes: [],
      jobs: [],
      nodes: [],
    });
  });

  it('refuses an id that is not lower-case kebab-case', () => {
    expect(problemsOf(aManifest({ id: 'Anime_Tracker' }))).toContain(
      'Plugin ids are lower-case kebab-case',
    );
  });

  it('refuses a version that is not full semver, and an api range it cannot read', () => {
    expect(problemsOf(aManifest({ version: '1.2' }))).toContain(
      'A plugin version is a full semver version',
    );
    expect(problemsOf(aManifest({ apiVersion: '>=1 <2' }))).toContain(
      'apiVersion is a semver range such as ^1.0',
    );
  });

  it('refuses a PKCE method from a plugin that would also install on servers before 1.3', () => {
    const provider = {
      id: 'mal',
      name: 'MyAnimeList',
      authorizeUrl: 'https://myanimelist.net/v1/oauth2/authorize',
      tokenUrl: 'https://myanimelist.net/v1/oauth2/token',
      scopes: [],
      clientIdSetting: 'malClientId',
      pkce: 'plain' as const,
    };
    const withPkce = (apiVersion: string) =>
      aManifest({
        apiVersion,
        permissions: [
          { kind: 'viewing', access: 'read' },
          { kind: 'network', hosts: ['myanimelist.net'] },
          { kind: 'accounts', providers: [provider] },
        ],
        settings: [{ id: 'malClientId', label: 'Client id', kind: 'text' }],
      });

    expect(problemsOf(withPkce('^1.2'))).toContain(
      'Choosing a PKCE method needs apiVersion ^1.3, since older servers ignore it',
    );
    expect(problemsOf(withPkce('^1.3'))).toEqual([]);
  });

  it('lets a plugin offer a download client or a source only where it lists the hosts of its files, on 1.4', () => {
    const offering = (apiVersion: string, permissions: PluginManifestInput['permissions']) =>
      aManifest({
        apiVersion,
        permissions,
        contributes: {
          downloadClients: [{ id: 'files', title: 'Example files', protocol: 'torrent' }],
          sources: [{ id: 'files', title: 'Example files', kinds: ['film'] }],
        },
      });
    const network = { kind: 'network' as const, hosts: ['api.files.example.com'] };
    const links = { kind: 'links' as const, hosts: ['*.files.example.com'] };

    expect(problemsOf(offering('^1.4', [network, links]))).toEqual([]);
    expect(problemsOf(offering('^1.4', [network]))).toEqual([
      'A download client or a source lists the hosts its files come from under links',
    ]);
    expect(problemsOf(offering('^1.3', [network, links]))).toEqual([
      'A download client or a source needs apiVersion ^1.4, since older servers ignore it',
    ]);
  });

  it('lets a plugin read every library only on 1.4', () => {
    const reading = (apiVersion: string) =>
      aManifest({
        apiVersion,
        permissions: [
          { kind: 'library', access: 'everything' },
          { kind: 'viewing', access: 'read' },
        ],
      });

    expect(problemsOf(reading('^1.4'))).toEqual([]);
    expect(problemsOf(reading('^1.3'))).toEqual([
      'Reading every library needs apiVersion ^1.4, since older servers refuse it',
    ]);
    expect(
      problemsOf(
        aManifest({
          apiVersion: '^1.3',
          permissions: [
            { kind: 'library', access: 'read' },
            { kind: 'viewing', access: 'read' },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it('lets a plugin answer apps only with the routes permission, public where a route is, on 1.4', () => {
    const route = (signIn: RouteSignIn[]) => ({
      routes: [{ id: 'rest', title: 'Music apps', methods: ['GET' as const], signIn }],
    });
    const answering = (
      apiVersion: string,
      permissions: PluginManifestInput['permissions'],
      signIn: RouteSignIn[] = [{ kind: 'bearer' }],
    ) => aManifest({ apiVersion, permissions, contributes: route(signIn) });

    expect(problemsOf(answering('^1.4', [{ kind: 'routes' }]))).toEqual([]);
    expect(problemsOf(answering('^1.4', []))).toEqual([
      'Answering requests from outside Valence needs the routes permission',
    ]);
    expect(problemsOf(answering('^1.4', [{ kind: 'routes' }], [{ kind: 'public' }]))).toEqual([
      'A route anybody may call without signing in needs the routes permission public',
    ]);
    expect(
      problemsOf(answering('^1.4', [{ kind: 'routes', public: true }], [{ kind: 'public' }])),
    ).toEqual([]);
    expect(problemsOf(answering('^1.3', [{ kind: 'routes' }]))).toEqual([
      'Answering requests needs apiVersion ^1.4, since older servers ignore it',
    ]);
    expect(
      problemsOf(
        aManifest({
          apiVersion: '^1.4',
          permissions: [{ kind: 'routes' }],
          contributes: {
            routes: [
              { id: 'rest', title: 'A', methods: ['GET'], signIn: [{ kind: 'bearer' }] },
              { id: 'rest', title: 'B', methods: ['GET'], signIn: [{ kind: 'bearer' }] },
            ],
          },
        }),
      ),
    ).toEqual(['Each route id is used once']);
  });

  it('refuses a permission declared twice', () => {
    expect(
      problemsOf(
        aManifest({
          permissions: [
            { kind: 'viewing', access: 'read' },
            { kind: 'viewing', access: 'write' },
          ],
        }),
      ),
    ).toContain('Each permission is declared once');
  });

  it('insists on an entry when the plugin has anything to run', () => {
    expect(problemsOf({ ...aManifest(), entry: undefined })).toContain(
      'A plugin with pages, panels, schedules, events, webhooks, download clients, sources, routes, jobs or permissions names its entry',
    );
  });

  it('insists that an account provider’s hosts are listed under network', () => {
    const problems = problemsOf(
      aManifest({
        permissions: [
          { kind: 'network', hosts: ['graphql.anilist.co'] },
          {
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
          },
        ],
        settings: [{ id: 'clientId', label: 'Client id', kind: 'text' }],
      }),
    );

    expect(problems).toContain('anilist.co is used by AniList but not listed under network');
  });

  it('insists that a provider’s revocation address is listed under network too', () => {
    const problems = problemsOf(
      aManifest({
        permissions: [
          { kind: 'network', hosts: ['anilist.co'] },
          { kind: 'viewing', access: 'write' },
          {
            kind: 'accounts',
            providers: [
              {
                id: 'anilist',
                name: 'AniList',
                authorizeUrl: 'https://anilist.co/api/v2/oauth/authorize',
                tokenUrl: 'https://anilist.co/api/v2/oauth/token',
                revokeUrl: 'https://auth.anilist.co/revoke',
                scopes: [],
                clientIdSetting: 'clientId',
              },
            ],
          },
        ],
        settings: [{ id: 'clientId', label: 'Client id', kind: 'text' }],
      }),
    );

    expect(problems).toEqual(['auth.anilist.co is used by AniList but not listed under network']);
  });

  it('keeps a setting’s link to where its value comes from, which must be https', () => {
    const link = { label: 'example.com/apps', url: 'https://example.com/apps' };
    const manifest = PluginManifestSchema.parse(
      aManifest({ settings: [{ id: 'clientId', label: 'Client id', kind: 'text', link }] }),
    );

    expect(manifest.settings[0]?.link).toEqual(link);
    expect(
      problemsOf(
        aManifest({
          settings: [
            {
              id: 'clientId',
              label: 'Client id',
              kind: 'text',
              link: { label: 'Apps', url: 'http://example.com/apps' },
            },
          ],
        }),
      ),
    ).not.toEqual([]);
  });

  it('insists that an account provider’s settings are declared', () => {
    const problems = problemsOf(
      aManifest({
        permissions: [
          { kind: 'network', hosts: ['anilist.co'] },
          { kind: 'viewing', access: 'write' },
          {
            kind: 'accounts',
            providers: [
              {
                id: 'anilist',
                name: 'AniList',
                authorizeUrl: 'https://anilist.co/api/v2/oauth/authorize',
                tokenUrl: 'https://anilist.co/api/v2/oauth/token',
                scopes: [],
                clientIdSetting: 'clientId',
                clientSecretSetting: 'clientSecret',
              },
            ],
          },
        ],
        settings: [{ id: 'clientId', label: 'Client id', kind: 'text' }],
      }),
    );

    expect(problems).toEqual(['AniList reads the setting clientSecret, which is not declared']);
  });

  it('refuses two contributions sharing an id', () => {
    expect(
      problemsOf(
        aManifest({
          contributes: {
            pages: [{ id: 'sync', title: 'Sync', placement: 'account' }],
            panels: [{ id: 'sync', title: 'Sync', on: 'title' }],
            schedules: [{ id: 'sync', label: 'Sync', everyMinutes: 60 }],
          },
        }),
      ),
    ).not.toContain('Each contribution id is used once');
    expect(
      problemsOf(
        aManifest({
          contributes: {
            pages: [
              { id: 'sync', title: 'Sync', placement: 'account' },
              { id: 'sync', title: 'Sync again', placement: 'admin' },
            ],
          },
        }),
      ),
    ).toContain('Each contribution id is used once');
  });

  it('lets a page or panel require only a permission node the plugin declares, once', () => {
    const declared = aManifest({
      contributes: {
        pages: [{ id: 'sync', title: 'Sync', placement: 'account', requires: 'sync' }],
        nodes: [{ id: 'sync', title: 'Sync lists' }],
      },
    });

    expect(problemsOf(declared)).toEqual([]);
    expect(
      problemsOf(
        aManifest({
          contributes: {
            panels: [{ id: 'score', title: 'Score', on: 'title', requires: 'rate' }],
          },
        }),
      ),
    ).toContain('Score requires rate, which is not declared under nodes');
    expect(
      problemsOf(
        aManifest({
          contributes: {
            nodes: [
              { id: 'sync', title: 'Sync lists' },
              { id: 'sync', title: 'Sync lists again' },
            ],
          },
        }),
      ),
    ).toContain('Each permission node is declared once');
  });

  it('receives webhooks only with the webhooks permission, each id once', () => {
    const hooks = { webhooks: [{ id: 'ping', title: 'Pings' }] };

    expect(
      problemsOf(
        aManifest({ contributes: hooks, permissions: [{ kind: 'viewing', access: 'write' }] }),
      ),
    ).toContain('Receiving webhooks needs the webhooks permission');
    expect(
      problemsOf(
        aManifest({
          contributes: hooks,
          permissions: [{ kind: 'viewing', access: 'write' }, { kind: 'webhooks' }],
        }),
      ),
    ).toEqual([]);
    expect(
      problemsOf(
        aManifest({
          contributes: {
            webhooks: [
              { id: 'ping', title: 'Pings' },
              { id: 'ping', title: 'Pings again' },
            ],
          },
          permissions: [{ kind: 'viewing', access: 'write' }, { kind: 'webhooks' }],
        }),
      ),
    ).toContain('Each webhook id is used once');
  });

  it('sends events to Valence’s webhooks only with the emits permission, each id once', () => {
    const emits = { emits: [{ id: 'imported', title: 'A playlist was imported' }] };
    const allowed = [{ kind: 'viewing', access: 'write' }, { kind: 'emits' }] as const;

    expect(
      problemsOf(
        aManifest({ contributes: emits, permissions: [{ kind: 'viewing', access: 'write' }] }),
      ),
    ).toContain('Sending events to Valence’s webhooks needs the emits permission');
    expect(problemsOf(aManifest({ contributes: emits, permissions: [...allowed] }))).toEqual([]);
    expect(
      problemsOf(
        aManifest({
          contributes: {
            emits: [
              { id: 'imported', title: 'Imported' },
              { id: 'imported', title: 'Imported again' },
            ],
          },
          permissions: [...allowed],
        }),
      ),
    ).toContain('Each emitted event id is used once');
  });

  it('refuses an event the plugin has no permission to hear', () => {
    expect(
      problemsOf(aManifest({ permissions: [{ kind: 'network', hosts: ['anilist.co'] }] })),
    ).toContain('Hearing playback.finished needs the viewing permission');
  });

  it('hears pausing, progress, sessions and requests, everybody’s viewing, and runs jobs only on 1.4', () => {
    const newer = (apiVersion: string) =>
      aManifest({
        apiVersion,
        permissions: [
          { kind: 'viewing', access: 'read', household: true },
          { kind: 'requests', access: 'create' },
        ],
        contributes: {
          events: ['playback.progress', 'requests.made'],
          jobs: [{ id: 'import', title: 'Import history' }],
        },
      });

    expect(problemsOf(newer('^1.4'))).toEqual([]);
    expect(problemsOf(newer('^1.3'))).toEqual([
      'Hearing playback.progress, requests.made needs apiVersion ^1.4, since older servers refuse it',
      'Hearing everybody on the server needs apiVersion ^1.4, since older servers ignore it',
      'Queued jobs need apiVersion ^1.4, since older servers ignore them',
    ]);
  });

  it('hears requests only with the requests permission, and gives each job its own id', () => {
    expect(
      problemsOf(aManifest({ apiVersion: '^1.4', contributes: { events: ['requests.approved'] } })),
    ).toContain('Hearing requests.approved needs the requests permission');
    expect(
      problemsOf(
        aManifest({
          apiVersion: '^1.4',
          contributes: {
            jobs: [
              { id: 'import', title: 'Import' },
              { id: 'import', title: 'Import again' },
            ],
          },
        }),
      ),
    ).toContain('Each contribution id is used once');
  });

  it('takes a choice with its options and a number with its limits, on 1.4', () => {
    const settings = [
      {
        id: 'quality',
        label: 'Quality',
        kind: 'select' as const,
        options: [
          { value: 'high', label: 'High' },
          { value: 'low', label: 'Low' },
        ],
      },
      { id: 'pages', label: 'Pages', kind: 'number' as const, min: 1, max: 100 },
    ];

    expect(problemsOf(aManifest({ apiVersion: '^1.4', settings }))).toEqual([]);
    expect(problemsOf(aManifest({ apiVersion: '^1.3', settings }))).toContain(
      'A select or number setting needs apiVersion ^1.4, since older servers refuse it',
    );
    expect(
      problemsOf(
        aManifest({
          apiVersion: '^1.4',
          settings: [
            { id: 'quality', label: 'Quality', kind: 'select' },
            { id: 'name', label: 'Name', kind: 'text', min: 1 },
            { id: 'pages', label: 'Pages', kind: 'number', min: 5, max: 1 },
            {
              id: 'twice',
              label: 'Twice',
              kind: 'select',
              options: [
                { value: 'a', label: 'A' },
                { value: 'a', label: 'Also A' },
              ],
            },
          ],
        }),
      ),
    ).toEqual([
      'Quality lists options only if it is a select',
      'Name has a least or most only if it is a number',
      'Pages has a least larger than its most',
      'Twice lists each option once',
    ]);
  });

  it('refuses a schedule more often than every fifteen minutes', () => {
    expect(
      PluginManifestSchema.safeParse(
        aManifest({ contributes: { schedules: [{ id: 'sync', label: 'Sync', everyMinutes: 5 }] } }),
      ).success,
    ).toBe(false);
  });
});
