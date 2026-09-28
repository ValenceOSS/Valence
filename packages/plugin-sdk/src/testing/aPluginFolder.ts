import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PluginManifestInput } from '@ValenceSDK/manifest/PluginManifestSchema';
import { aManifest } from './aManifest';

/**
 * A plugin's working folder on disk, holding a manifest, its bundled code and an icon, for the
 * command-line tests to pack.
 *
 * @param changes - What this test changes about the manifest.
 * @returns The folder.
 */
const aPluginFolder = (changes: Partial<PluginManifestInput> = {}): string => {
  const folder = mkdtempSync(join(tmpdir(), 'valence-plugin-'));

  mkdirSync(join(folder, 'dist'));
  mkdirSync(join(folder, 'assets'));
  writeFileSync(join(folder, 'manifest.json'), JSON.stringify(aManifest({ icon: 'icon.png', ...changes })));
  writeFileSync(join(folder, 'dist', 'plugin.js'), 'globalThis.valencePlugin = {};');
  writeFileSync(join(folder, 'assets', 'icon.png'), 'png');
  writeFileSync(join(folder, 'assets', 'notes.txt'), 'ignored');

  return folder;
};

export { aPluginFolder };
