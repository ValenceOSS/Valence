import type { PluginManifest } from '@ValenceSDK/manifest/PluginManifestSchema';
import type { PluginSettingValues } from '@ValenceServer/plugins/store/PluginStore';

/**
 * The settings a new version of a plugin keeps from the version it replaces: each one the new
 * manifest still declares as the same kind. A setting whose kind changed starts empty, so text is
 * never handed over as a secret that cannot be opened, a sealed secret is never handed over as
 * text, and a toggle never arrives as words.
 *
 * @param from - The manifest of the version being replaced.
 * @param to - The manifest of the version replacing it.
 * @param kept - The settings as kept now, secrets sealed.
 * @returns The settings the new version starts with.
 */
const carrySettings = (
  from: PluginManifest,
  to: PluginManifest,
  kept: PluginSettingValues,
): PluginSettingValues =>
  Object.fromEntries(
    to.settings.flatMap((setting): [string, string | boolean][] => {
      const value = kept[setting.id];
      const was = from.settings.find((each) => each.id === setting.id);

      return value === undefined ||
        was?.kind !== setting.kind ||
        typeof value !== (setting.kind === 'toggle' ? 'boolean' : 'string')
        ? []
        : [[setting.id, value]];
    }),
  );

export { carrySettings };
