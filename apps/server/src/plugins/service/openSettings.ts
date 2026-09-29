import { openSecret } from '@ValenceServer/plugins/openSecret';
import type { PluginManifest } from '@ValenceSDK/manifest/PluginManifestSchema';
import type { PluginSettingValues } from '@ValenceServer/plugins/store/PluginStore';

/**
 * A plugin's settings as the plugin reads them, with its secret ones opened. Anything the manifest
 * no longer declares is left out.
 *
 * @param manifest - The plugin's manifest.
 * @param kept - The settings as kept, secrets sealed.
 * @param key - The sealing key.
 * @returns The settings, opened.
 */
const openSettings = (
  manifest: PluginManifest,
  kept: PluginSettingValues,
  key: Buffer,
): PluginSettingValues =>
  Object.fromEntries(
    manifest.settings.flatMap((setting): [string, string | boolean][] => {
      const value = kept[setting.id];

      if (value === undefined) {
        return [];
      }

      if (setting.kind === 'secret') {
        const opened = typeof value === 'string' ? openSecret(key, value) : null;

        return opened === null ? [] : [[setting.id, opened]];
      }

      return [[setting.id, value]];
    }),
  );

export { openSettings };
