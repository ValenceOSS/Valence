import { describe, expect, it } from 'vitest';
import { aManifest } from '@ValenceSDK/testing/aManifest';
import { PluginManifestSchema } from './PluginManifestSchema';

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
      'A plugin with pages, panels, schedules, events, webhooks or permissions names its entry',
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

  it('refuses a schedule more often than every fifteen minutes', () => {
    expect(
      PluginManifestSchema.safeParse(
        aManifest({ contributes: { schedules: [{ id: 'sync', label: 'Sync', everyMinutes: 5 }] } }),
      ).success,
    ).toBe(false);
  });
});
