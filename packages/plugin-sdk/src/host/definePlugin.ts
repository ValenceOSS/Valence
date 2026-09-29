import type { PluginDefinition } from './PluginDefinition';

const SLOT = 'valencePlugin';

/**
 * Declares what a plugin does: its pages and panels, its scheduled work and what it does when
 * something happens. Everything a handler needs from Valence arrives in its context, so a plugin
 * never reaches for anything global.
 *
 * Called once at the top of the plugin's bundle; Valence's sandbox reads the definition back when
 * the bundle has run.
 *
 * @param definition - The plugin's handlers.
 * @returns The same definition, for tests to call directly.
 */
const definePlugin = (definition: PluginDefinition): PluginDefinition => {
  Reflect.set(globalThis, SLOT, definition);

  return definition;
};

export { definePlugin };
