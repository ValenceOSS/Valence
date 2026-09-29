import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';
import type { PluginAccountPage } from './AccountArea.types';

/**
 * The account pages plugins add, each named the way it is addressed in the account dialog: the
 * plugin and the page, joined so neither can be mistaken for one of Valence's own panels.
 *
 * @param contributions - What the plugins that are on add, where that has been read.
 * @returns Each page, with the id it is addressed by, the title on its tab and the plugin it is
 *   from.
 */
const pluginAccountPages = (contributions: PluginContributions | undefined): PluginAccountPage[] =>
  (contributions?.pages ?? [])
    .filter((page) => page.placement === 'account')
    .map((page) => ({
      id: `plugin.${page.pluginId}.${page.pageId}`,
      label: page.title,
      pluginId: page.pluginId,
      pluginName: page.pluginName,
      pageId: page.pageId,
    }));

export { pluginAccountPages };
