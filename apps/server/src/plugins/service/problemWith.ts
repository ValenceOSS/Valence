import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import type { PluginManifest } from '@ValenceSDK/manifest/PluginManifestSchema';

const MOST_CHARACTERS = 4000;

/**
 * What is wrong with a value for one of a plugin's settings, if anything: a toggle takes true or
 * false, a number a finite number within its limits, a choice one of its options, and anything
 * else words of a sensible length.
 *
 * @param setting - The setting, as the manifest declares it.
 * @param value - The value.
 * @returns A sentence saying what is wrong, or null where nothing is.
 */
const problemWith = (
  setting: PluginManifest['settings'][number],
  value: string | boolean | number,
): Said | null => {
  const wrongKind = saying('server.service.changeSettings.labelIsTheWrongKindOf', {
    label: setting.label,
  });

  switch (setting.kind) {
    case 'toggle':
      return typeof value === 'boolean' ? null : wrongKind;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return wrongKind;
      }

      return (setting.min !== undefined && value < setting.min) ||
        (setting.max !== undefined && value > setting.max)
        ? saying('server.service.problemWith.labelIsOutsideItsLimits', { label: setting.label })
        : null;
    case 'select':
      if (typeof value !== 'string') {
        return wrongKind;
      }

      return (setting.options ?? []).some((option) => option.value === value)
        ? null
        : saying('server.service.problemWith.labelIsNotOneOfItsChoices', { label: setting.label });
    case 'text':
    case 'secret':
      if (typeof value !== 'string') {
        return wrongKind;
      }

      return value.length > MOST_CHARACTERS
        ? saying('server.service.changeSettings.labelIsTooLong', { label: setting.label })
        : null;
  }
};

export { problemWith };
