import type { PluginManifest } from '@ValenceSDK/manifest/PluginManifestSchema';
import type { PluginSettingValues } from '@ValenceServer/plugins/store/PluginStore';
import { problemWith } from './problemWith';

/**
 * The settings a new version of a plugin keeps from the version it replaces: each one the new
 * manifest still declares as the same kind. A setting whose kind changed starts empty, so text is
 * never handed over as a secret that cannot be opened, a sealed secret is never handed over as
 * text, a toggle never arrives as words, and a choice or a number the new version no longer takes
 * is dropped.
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
    to.settings.flatMap((setting): [string, string | boolean | number][] => {
      const value = kept[setting.id];
      const was = from.settings.find((each) => each.id === setting.id);

      return value === undefined ||
        was?.kind !== setting.kind ||
        (setting.kind === 'secret'
          ? typeof value !== 'string'
          : problemWith(setting, value) !== null)
        ? []
        : [[setting.id, value]];
    }),
  );

export { carrySettings };
