import { queryOptions } from '@tanstack/react-query';
import { fetchInstalledPlugins } from '@ValenceClient/plugins/fetchInstalledPlugins';
import { fetchPluginCatalogue } from '@ValenceClient/plugins/fetchPluginCatalogue';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { fetchPluginSurface } from '@ValenceClient/plugins/fetchPluginSurface';
import type { PluginPlace } from '@ValenceClient/plugins/PluginPlace';

const PLUGINS = ['plugins'] as const;

/**
 * The plugins this server has installed, for the admin area.
 *
 * @returns The query.
 */
const installed = () =>
  queryOptions({ queryKey: [...PLUGINS, 'installed'], queryFn: () => fetchInstalledPlugins() });

/**
 * The official catalogue, for the admin area.
 *
 * @returns The query.
 */
const catalogue = () =>
  queryOptions({
    queryKey: [...PLUGINS, 'catalogue'],
    queryFn: () => fetchPluginCatalogue(),
    staleTime: 300_000,
  });

/**
 * What the plugins that are on add for whoever is signed in.
 *
 * @returns The query.
 */
const contributions = () =>
  queryOptions({
    queryKey: [...PLUGINS, 'contributions'],
    queryFn: () => fetchPluginContributions(),
    retry: false,
    staleTime: 60_000,
  });

/**
 * One plugin page or panel, as the plugin drew it.
 *
 * @param place - Which page or panel.
 * @returns The query.
 */
const surface = (place: PluginPlace) =>
  queryOptions({
    queryKey: [...PLUGINS, 'surface', place],
    queryFn: () => fetchPluginSurface(place),
    retry: false,
  });

const pluginQueries = { installed, catalogue, contributions, surface, key: PLUGINS };

export { pluginQueries };
