import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PluginPackage } from '@ValenceSDK/package/PluginPackageSchema';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';

const ASSET_NAME = /^[a-z0-9-]+\.(png|jpg|webp)$/;

/**
 * Reads a plugin's working directory into what a package holds: `manifest.json`, the bundled code
 * the manifest names as its entry, and every picture under `assets/`.
 *
 * @param directory - The plugin's folder.
 * @returns The manifest, the code and the assets as base64, ready to pack.
 */
const readPluginDirectory = (directory: string): PluginPackage => {
  const manifest = PluginManifestSchema.parse(
    JSON.parse(readFileSync(join(directory, 'manifest.json'), 'utf8')),
  );
  const assetsFolder = join(directory, 'assets');
  const assets = existsSync(assetsFolder)
    ? Object.fromEntries(
        readdirSync(assetsFolder)
          .filter((name) => ASSET_NAME.test(name))
          .sort()
          .map((name) => [name, readFileSync(join(assetsFolder, name)).toString('base64')]),
      )
    : {};

  return {
    format: 1,
    manifest,
    ...(manifest.entry === undefined
      ? {}
      : { code: readFileSync(join(directory, manifest.entry), 'utf8') }),
    assets,
  };
};

export { readPluginDirectory };
