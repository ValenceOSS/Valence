import { sealSecret } from '@ValenceServer/plugins/sealSecret';
import type { PluginManifest } from '@ValenceSDK/manifest/PluginManifestSchema';
import type { PluginSettingValues } from '@ValenceServer/plugins/store/PluginStore';

/**
 * Applies an administrator's changes to a plugin's settings: each checked against the kind the
 * manifest declares, secrets sealed before they are kept, and nothing kept that was never declared.
 * A setting given as nothing is cleared.
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
  changes: Record<string, string | boolean | null>,
  key: Buffer,
): { settings: PluginSettingValues } | { problem: string } => {
  const next: Record<string, string | boolean | null> = { ...kept };

  for (const [id, value] of Object.entries(changes)) {
    const setting = manifest.settings.find((each) => each.id === id);

    if (setting === undefined) {
      return { problem: `This plugin has no setting called ${id}.` };
    }

    if (value === null) {
      next[id] = null;
      continue;
    }

    if (setting.kind === 'toggle' ? typeof value !== 'boolean' : typeof value !== 'string') {
      return { problem: `${setting.label} is the wrong kind of value.` };
    }

    if (typeof value === 'string' && value.length > 4000) {
      return { problem: `${setting.label} is too long.` };
    }

    next[id] =
      setting.kind === 'secret' && typeof value === 'string' ? sealSecret(key, value) : value;
  }

  return {
    settings: Object.fromEntries(
      Object.entries(next).flatMap(([id, value]): [string, string | boolean][] =>
        value === null || !manifest.settings.some((setting) => setting.id === id)
          ? []
          : [[id, value]],
      ),
    ),
  };
};

export { changeSettings };
