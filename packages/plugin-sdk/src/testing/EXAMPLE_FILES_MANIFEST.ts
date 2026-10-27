import type { PluginManifestInput } from '@ValenceSDK/manifest/PluginManifestSchema';

const EXAMPLE_FILES_MANIFEST = {
  manifestVersion: 2,
  id: 'example-files',
  name: 'Example files',
  version: '1.0.0',
  apiVersion: '^1.4',
  author: { name: 'Valence' },
  description: 'Shows how a remote file service becomes a download client and a source of films.',
  permissions: [
    { kind: 'network', hosts: ['api.files.example.test'] },
    { kind: 'links', hosts: ['*.files.example.test'] },
  ],
  contributes: {
    downloadClients: [{ id: 'files', title: 'Example files', protocol: 'torrent' }],
    sources: [{ id: 'files', title: 'Example files', kinds: ['film'] }],
  },
  entry: 'dist/plugin.js',
  settings: [{ id: 'apiKey', label: 'API key', kind: 'secret' }],
} satisfies PluginManifestInput;

export { EXAMPLE_FILES_MANIFEST };
