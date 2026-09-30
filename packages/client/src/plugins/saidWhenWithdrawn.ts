import type { PluginChange } from '@ValenceContracts/schemas/Plugin';
import { say } from '@ValenceI18n/say';

/**
 * What to tell somebody whose plugin page closed because an administrator withdrew the plugin.
 *
 * @param pluginName - What the plugin is called.
 * @param change - Whether it was turned off or removed.
 * @returns The sentence to show.
 */
const saidWhenWithdrawn = (pluginName: string, change: PluginChange['change']): string =>
  say(
    change === 'removed'
      ? 'client.plugins.saidWhenWithdrawn.pluginWasRemoved'
      : 'client.plugins.saidWhenWithdrawn.pluginWasTurnedOff',
    { pluginName },
  );

export { saidWhenWithdrawn };
