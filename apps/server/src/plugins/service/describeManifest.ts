import type { PluginSummary } from '@ValenceContracts/schemas/Plugin';
import type { PluginManifest } from '@ValenceSDK/manifest/PluginManifestSchema';

/**
 * What an administrator is told about a plugin before or after installing it, read off its
 * manifest.
 *
 * @param manifest - The plugin's manifest.
 * @returns The summary.
 */
const describeManifest = (manifest: PluginManifest): Omit<PluginSummary, 'trust'> => ({
  id: manifest.id,
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  author: manifest.author.name,
  homepage: manifest.homepage ?? null,
  iconUrl:
    manifest.icon === undefined ? null : `/api/plugins/${manifest.id}/assets/${manifest.icon}`,
  permissions: manifest.permissions,
  pages: manifest.contributes.pages.map(({ id, title, placement }) => ({ id, title, placement })),
  panels: manifest.contributes.panels.map(({ id, title, on }) => ({ id, title, on })),
  themes: manifest.contributes.themes.map(({ id, name }) => ({ id, name })),
  schedules: manifest.contributes.schedules.map(({ id, label, everyMinutes }) => ({
    id,
    label,
    everyMinutes,
  })),
  events: [...manifest.contributes.events],
});

export { describeManifest };
