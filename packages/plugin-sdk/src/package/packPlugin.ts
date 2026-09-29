import { gzipSync } from 'node:zlib';
import type { PluginPackage } from './PluginPackageSchema';
import { PluginPackageSchema } from './PluginPackageSchema';

/**
 * Packs a plugin into the single file Valence installs: its manifest, its bundled code and its
 * pictures, checked against the package rules and gzipped.
 *
 * @param plugin - The manifest, the code and the assets as base64.
 * @returns The `.vplugin` bytes.
 */
const packPlugin = (plugin: PluginPackage): Uint8Array =>
  gzipSync(JSON.stringify(PluginPackageSchema.parse(plugin)), { level: 9 });

export { packPlugin };
