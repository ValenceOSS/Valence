import { queryOptions } from '@tanstack/react-query';
import { fetchInstalledPlugins } from '@ValenceClient/plugins/fetchInstalledPlugins';
import { fetchPluginCatalogue } from '@ValenceClient/plugins/fetchPluginCatalogue';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { fetchPluginRemoval } from '@ValenceClient/plugins/fetchPluginRemoval';
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

/**
 * What removing one plugin would take with it, read fresh each time somebody asks to remove it.
 *
 * @param id - The plugin.
 * @returns The query.
 */
const removal = (id: string) =>
  queryOptions({
    queryKey: [...PLUGINS, 'removal', id],
    queryFn: () => fetchPluginRemoval(id),
    staleTime: 0,
  });

const pluginQueries = { installed, catalogue, contributions, surface, removal, key: PLUGINS };

export { pluginQueries };
