import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings } from '@keyline-icons/react-native/fill';
import { ACCOUNT_PANELS } from '@ValenceMobile/components/TheAccount/ACCOUNT_PANELS';
import { PLUGIN_ICONS } from '@ValenceMobile/plugins/PLUGIN_ICONS';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import type { Segment } from '@ValenceMobile/components/SegmentedRow/SegmentedRow.types';

/**
 * The tabs of somebody's account: Valence's own, then a tab for each page a plugin on this server
 * adds to it, named as the plugin names it.
 *
 * @returns The tabs, in the order they are drawn.
 */
const useAccountPanels = (): readonly Segment[] => {
  const contributions = useQuery(pluginQueries.contributions());
  const pages = contributions.data?.pages;

  return useMemo(
    () => [
      ...ACCOUNT_PANELS,
      ...(pages ?? [])
        .filter((page) => page.placement === 'account')
        .map((page) => ({
          id: `plugin:${page.pluginId}:${page.pageId}`,
          label: page.title,
          icon: page.icon === null ? Settings : PLUGIN_ICONS[page.icon],
        })),
    ],
    [pages],
  );
};

export { useAccountPanels };
