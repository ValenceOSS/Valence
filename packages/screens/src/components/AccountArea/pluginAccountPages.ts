import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';

/**
 * The account pages plugins add, each named the way it is addressed in the account dialog: the
 * plugin and the page, joined so neither can be mistaken for one of Valence's own panels.
 *
 * @param contributions - What the plugins that are on add, where that has been read.
 * @returns Each page, with the id it is addressed by and the title on its tab.
 */
const pluginAccountPages = (
  contributions: PluginContributions | undefined,
): { id: string; label: string; pluginId: string; pageId: string }[] =>
  (contributions?.pages ?? [])
    .filter((page) => page.placement === 'account')
    .map((page) => ({
      id: `plugin.${page.pluginId}.${page.pageId}`,
      label: page.title,
      pluginId: page.pluginId,
      pageId: page.pageId,
    }));

export { pluginAccountPages };
