import type { Said } from '@ValenceI18n/SaidSchema';
import { sealSecret } from '@ValenceServer/plugins/sealSecret';
import type { PluginManifest } from '@ValenceSDK/manifest/PluginManifestSchema';
import type { PluginSettingValues } from '@ValenceServer/plugins/store/PluginStore';
import { saying } from '@ValenceI18n/saying';
import { problemWith } from './problemWith';

/**
 * Applies an administrator's changes to a plugin's settings: each checked against the kind the
 * manifest declares, a choice against its options and a number against its limits, secrets sealed
 * before they are kept, and nothing kept that was never declared. A setting given as nothing is
 * cleared.
 *
 * @param manifest - The plugin's manifest.
 * @param kept - The settings as kept now.
 * @param changes - What the administrator changed.
 * @param key - The sealing key.
 * @returns The settings to keep, or a sentence saying what was wrong.
 */
const changeSettings = (
  manifest: PluginManifest,
  kept: PluginSettingValues,
  changes: Record<string, string | boolean | number | null>,
  key: Buffer,
): { settings: PluginSettingValues } | { problem: Said } => {
  const next: Record<string, string | boolean | number | null> = { ...kept };

  for (const [id, value] of Object.entries(changes)) {
    const setting = manifest.settings.find((each) => each.id === id);

    if (setting === undefined) {
      return {
        problem: saying('server.service.changeSettings.thisPluginHasNoSettingCalled', { id }),
      };
    }

    if (value === null) {
      next[id] = null;
      continue;
    }

    const problem = problemWith(setting, value);

    if (problem !== null) {
      return { problem };
    }

    next[id] =
      setting.kind === 'secret' && typeof value === 'string' ? sealSecret(key, value) : value;
  }

  return {
    settings: Object.fromEntries(
      Object.entries(next).flatMap(([id, value]): [string, string | boolean | number][] =>
        value === null || !manifest.settings.some((setting) => setting.id === id)
          ? []
          : [[id, value]],
      ),
    ),
  };
};

export { changeSettings };
