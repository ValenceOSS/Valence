import { queryOptions } from '@tanstack/react-query';
import { fetchAppPasswords } from '@ValenceClient/plugins/fetchAppPasswords';
import { fetchInstalledPlugins } from '@ValenceClient/plugins/fetchInstalledPlugins';
import { fetchPluginCatalogue } from '@ValenceClient/plugins/fetchPluginCatalogue';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { fetchPluginHomeRowChoices } from '@ValenceClient/plugins/fetchPluginHomeRowChoices';
import { fetchPluginHomeRows } from '@ValenceClient/plugins/fetchPluginHomeRows';
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
 * The rows plugins add to this profile's home page. Valence answers from what each plugin last
 * said, so this never waits on a plugin, and asks again now and then for what has changed.
 *
 * @returns The query.
 */
const homeRows = () =>
  queryOptions({
    queryKey: [...PLUGINS, 'homeRows'],
    queryFn: () => fetchPluginHomeRows(),
    retry: false,
    staleTime: 60_000,
  });

/**
 * Every row the plugins that are turned on offer for the home page, and whether this profile
 * chose it.
 *
 * @returns The query.
 */
const homeRowChoices = () =>
  queryOptions({
    queryKey: [...PLUGINS, 'homeRowChoices'],
    queryFn: () => fetchPluginHomeRowChoices(),
    retry: false,
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

/**
 * The app passwords the signed-in profile made for one plugin, read fresh each time they are shown.
 *
 * @param pluginId - The plugin.
 * @returns The query.
 */
const appPasswords = (pluginId: string) =>
  queryOptions({
    queryKey: [...PLUGINS, 'appPasswords', pluginId],
    queryFn: () => fetchAppPasswords(pluginId),
    retry: false,
    staleTime: 0,
  });

const pluginQueries = {
  installed,
  catalogue,
  contributions,
  homeRows,
  homeRowChoices,
  surface,
  removal,
  appPasswords,
  key: PLUGINS,
};

export { pluginQueries };
