import type { PluginManifestInput } from '@ValenceSDK/manifest/PluginManifestSchema';

/**
 * A manifest that passes every rule, for a test to change one thing about.
 *
 * @param changes - What this test changes.
 * @returns The manifest, before parsing.
 */
const aManifest = (changes: Partial<PluginManifestInput> = {}): PluginManifestInput => ({
  manifestVersion: 2,
  id: 'anime-tracker',
  name: 'Anime tracker',
  version: '1.2.0',
  apiVersion: '^1.0',
  author: { name: 'Valence', url: 'https://github.com/ValenceOSS' },
  description: 'Keeps what you watch in step with your anime list.',
  permissions: [
    { kind: 'network', hosts: ['graphql.anilist.co', 'anilist.co'] },
    { kind: 'viewing', access: 'write' },
  ],
  contributes: {
    pages: [{ id: 'tracking', title: 'Anime tracking', placement: 'account', icon: 'tv' }],
    panels: [],
    themes: [],
    schedules: [{ id: 'sync', label: 'Sync lists', everyMinutes: 60 }],
    events: ['playback.finished'],
  },
  entry: 'dist/plugin.js',
  settings: [],
  ...changes,
});

export { aManifest };
