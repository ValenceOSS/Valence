import type { InstalledPlugin } from '@ValenceContracts/schemas/Plugin';

/**
 * An installed plugin with every field filled in, for tests to change the parts they care about.
 *
 * @param overrides - Anything a test wants different.
 * @returns The plugin.
 */
const aPlugin = (overrides: Partial<InstalledPlugin> = {}): InstalledPlugin => ({
  id: 'anilist',
  name: 'AniList',
  version: '1.0.0',
  description: 'Keeps AniList in step with what you watch.',
  author: 'Valence',
  homepage: null,
  iconUrl: null,
  trust: 'official',
  permissions: [{ kind: 'network', hosts: ['graphql.anilist.co'] }],
  pages: [{ id: 'tracking', title: 'Anime tracking', placement: 'account' }],
  panels: [],
  themes: [],
  schedules: [],
  events: [],
  isEnabled: true,
  state: 'running',
  problem: null,
  settings: [
    {
      id: 'clientId',
      label: 'Client id',
      kind: 'text',
      help: 'Create an app with the redirect address.',
      link: { label: 'example.com/apps', url: 'https://example.com/apps' },
      value: 'abc',
      isSet: true,
    },
    {
      id: 'clientSecret',
      label: 'Client secret',
      kind: 'secret',
      help: null,
      link: null,
      value: null,
      isSet: true,
    },
    {
      id: 'pushProgress',
      label: 'Send progress',
      kind: 'toggle',
      help: 'As you watch',
      link: null,
      value: true,
      isSet: true,
    },
  ],
  installedAt: '2026-09-28T10:00:00.000Z',
  updatedAt: '2026-09-28T10:00:00.000Z',
  updateAvailable: null,
  webhooks: [],
  previousVersion: null,
  ...overrides,
});

export { aPlugin };
