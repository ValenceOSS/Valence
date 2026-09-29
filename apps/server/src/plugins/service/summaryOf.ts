import { describeManifest } from './describeManifest';
import type { InstalledPlugin } from '@ValenceContracts/schemas/Plugin';
import type { InstalledRecord } from '@ValenceServer/plugins/store/PluginStore';

/**
 * What an administrator is told about an installed plugin: what it is, whether it is running, and
 * its settings — a secret one said to be set or not, never shown.
 *
 * @param record - The installed plugin.
 * @param state - Whether its sandbox is running.
 * @param updateAvailable - A newer version the catalogue has, where it has one.
 * @param webhooks - The private address each of its webhooks is reached at.
 * @returns The summary.
 */
const summaryOf = (
  record: InstalledRecord,
  state: InstalledPlugin['state'],
  updateAvailable: string | null,
  webhooks: InstalledPlugin['webhooks'] = [],
): InstalledPlugin => ({
  ...describeManifest(record.manifest),
  trust: record.trust,
  isEnabled: record.isEnabled,
  state: record.isEnabled ? state : 'stopped',
  problem: record.problem,
  settings: record.manifest.settings.map((setting) => {
    const value = record.settings[setting.id];

    return {
      id: setting.id,
      label: setting.label,
      kind: setting.kind,
      help: setting.help ?? null,
      value: setting.kind === 'secret' || value === undefined ? null : value,
      isSet: value !== undefined,
    };
  }),
  installedAt: record.installedAt,
  updatedAt: record.updatedAt,
  updateAvailable,
  previousVersion: record.previousVersion,
  webhooks,
});

export { summaryOf };
