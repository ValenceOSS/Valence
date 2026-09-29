import type { PluginChange } from '@ValenceContracts/schemas/Plugin';

/**
 * What to tell somebody whose plugin page closed because an administrator withdrew the plugin.
 *
 * @param pluginName - What the plugin is called.
 * @param change - Whether it was turned off or removed.
 * @returns The sentence to show.
 */
const saidWhenWithdrawn = (pluginName: string, change: PluginChange['change']): string =>
  `${pluginName} was ${change === 'removed' ? 'removed' : 'turned off'} by an administrator.`;

export { saidWhenWithdrawn };
