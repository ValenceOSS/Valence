import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { pluginQueries } from './pluginQueries';

vi.mock('@ValenceClient/plugins/fetchInstalledPlugins', () => ({
  fetchInstalledPlugins: () => Promise.resolve(['installed']),
}));
vi.mock('@ValenceClient/plugins/fetchPluginCatalogue', () => ({
  fetchPluginCatalogue: () => Promise.resolve('catalogue'),
}));
vi.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: () => Promise.resolve('contributions'),
}));
vi.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({
  fetchPluginSurface: () => Promise.resolve('surface'),
}));

const PLACE = { kind: 'page', pluginId: 'anilist', pageId: 'tracking' } as const;

describe('pluginQueries', () => {
  it('keeps every plugin query under one key, so one invalidation reads them all again', () => {
    for (const query of [
      pluginQueries.installed(),
      pluginQueries.catalogue(),
      pluginQueries.contributions(),
      pluginQueries.surface(PLACE),
    ]) {
      expect(query.queryKey[0]).toBe('plugins');
    }

    expect(pluginQueries.surface(PLACE).queryKey).toEqual(['plugins', 'surface', PLACE]);
  });

  it('reads each from the server', async () => {
    const cache = new QueryClient();

    await expect(cache.fetchQuery(pluginQueries.installed())).resolves.toEqual(['installed']);
    await expect(cache.fetchQuery(pluginQueries.catalogue())).resolves.toBe('catalogue');
    await expect(cache.fetchQuery(pluginQueries.contributions())).resolves.toBe('contributions');
    await expect(cache.fetchQuery(pluginQueries.surface(PLACE))).resolves.toBe('surface');
  });
});
