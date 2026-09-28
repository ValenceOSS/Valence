import { PluginSummarySchema } from '@ValenceContracts/schemas/Plugin';
import { aPlugin } from '@ValenceClient/testing/aPlugin';
import type { InstallPreview } from '@ValenceContracts/schemas/Plugin';

/**
 * What the server says installing a plugin would mean, for tests.
 *
 * @param overrides - Anything a test wants different.
 * @returns The preview.
 */
const anInstallPreview = (overrides: Partial<InstallPreview> = {}): InstallPreview => ({
  token: 'token-1',
  permissionsHash: 'a'.repeat(64),
  plugin: PluginSummarySchema.parse(aPlugin()),
  trust: 'official',
  warnings: [],
  replacesVersion: null,
  ...overrides,
});

export { anInstallPreview };
