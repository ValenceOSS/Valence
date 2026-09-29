import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchInstalledPlugins } from './fetchInstalledPlugins';
import { fetchPluginCatalogue } from './fetchPluginCatalogue';
import { fetchPluginContributions } from './fetchPluginContributions';
import { fetchPluginRemoval } from './fetchPluginRemoval';
import { fetchPluginSurface } from './fetchPluginSurface';
import { aPlugin } from '@ValenceClient/testing/aPlugin';

const fetchMock = vi.fn<(input: string) => Promise<Response>>();

const answer = (body: object, status = 200) => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('plugin reads', () => {
  it('reads the installed plugins', async () => {
    answer({
      plugins: [aPlugin()],
      redirectUri: 'https://valence.test/api/plugins/oauth/callback',
    });

    await expect(fetchInstalledPlugins()).resolves.toEqual({
      plugins: [aPlugin()],
      redirectUri: 'https://valence.test/api/plugins/oauth/callback',
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins');
  });

  it('reads the catalogue, reachable or not', async () => {
    answer({ isReachable: false, problem: 'Offline', plugins: [] });

    await expect(fetchPluginCatalogue()).resolves.toEqual({
      isReachable: false,
      problem: 'Offline',
      plugins: [],
    });
  });

  it('reads what plugins add', async () => {
    answer({ pages: [], panels: [], themes: [], nodes: [] });

    await expect(fetchPluginContributions()).resolves.toEqual({
      pages: [],
      panels: [],
      themes: [],
      nodes: [],
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/contributions');
  });

  it('reads what removing a plugin would take with it', async () => {
    const removal = {
      bytesKept: 10,
      people: 1,
      accounts: [],
      themes: 0,
      nodes: 0,
      webhooks: 0,
      keepsEarlierVersion: false,
    };

    answer(removal);

    await expect(fetchPluginRemoval('music-import')).resolves.toEqual(removal);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/music-import/removal');
  });

  it('reads a page, and refuses one that breaks the building blocks', async () => {
    answer({ blocks: [{ type: 'heading', text: 'Hello' }] });

    await expect(
      fetchPluginSurface({ kind: 'page', pluginId: 'anilist', pageId: 'tracking' }),
    ).resolves.toEqual({
      blocks: [{ type: 'heading', text: 'Hello' }],
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/anilist/pages/tracking');

    answer({ blocks: [{ type: 'script', text: 'alert(1)' }] });

    await expect(
      fetchPluginSurface({ kind: 'page', pluginId: 'anilist', pageId: 'tracking' }),
    ).rejects.toThrow();
  });

  it('asks for a panel beside what it is shown with', async () => {
    answer({ blocks: [] });

    await fetchPluginSurface({
      kind: 'panel',
      pluginId: 'anilist',
      panelId: 'score',
      on: 'series',
      subjectId: 's1',
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/api/plugins/anilist/panels/score?kind=series&subject=s1',
    );
  });
});
