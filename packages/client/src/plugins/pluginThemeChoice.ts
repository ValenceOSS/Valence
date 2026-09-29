import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { PLUGIN_THEME_CHOICE_KEY } from '@ValenceClient/plugins/PLUGIN_THEME_CHOICE_KEY';

const ChoiceSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]{2,63}\/[a-z][a-z0-9-]{0,39}$/)
  .nullable()
  .catch(null);

const listeners = new Set<(choice: string | null) => void>();

/**
 * Which plugin theme somebody chose on this device, written as `plugin/theme`, or nothing where they
 * use Valence's own colours.
 *
 * @returns The choice.
 */
const chosenPluginTheme = (): string | null =>
  ChoiceSchema.parse(platformInUse().store.read(PLUGIN_THEME_CHOICE_KEY));

/**
 * Remembers a plugin theme on this device, or forgets one, and tells whoever is drawing with it.
 *
 * @param choice - `plugin/theme`, or nothing for Valence's own colours.
 */
const choosePluginTheme = (choice: string | null): void => {
  const { store } = platformInUse();
  const kept = ChoiceSchema.parse(choice);

  if (kept === null) {
    store.forget(PLUGIN_THEME_CHOICE_KEY);
  } else {
    store.write(PLUGIN_THEME_CHOICE_KEY, kept);
  }

  for (const listener of listeners) {
    listener(kept);
  }
};

/**
 * Watches for the plugin theme being changed.
 *
 * @param listener - Told whenever it changes.
 * @returns A way to stop listening.
 */
const whenPluginThemeChanges = (listener: (choice: string | null) => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export { choosePluginTheme, chosenPluginTheme, whenPluginThemeChanges };
