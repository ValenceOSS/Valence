import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { packPlugin } from '@ValenceSDK/package/packPlugin';
import { packageFileName } from './packageFileName';
import { readPluginDirectory } from './readPluginDirectory';

/**
 * Packs the plugin in a folder into a `.vplugin` file.
 *
 * @param directory - The plugin's folder, holding `manifest.json`.
 * @param outDirectory - Where to write the package.
 * @returns Where the package was written.
 */
const packCommand = (directory: string, outDirectory: string): string => {
  const plugin = readPluginDirectory(directory);
  const path = join(outDirectory, packageFileName(plugin.manifest.id, plugin.manifest.version));

  mkdirSync(outDirectory, { recursive: true });
  writeFileSync(path, packPlugin(plugin));

  return path;
};

export { packCommand };
