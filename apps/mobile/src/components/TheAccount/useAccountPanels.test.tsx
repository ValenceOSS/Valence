import { renderHook, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { ACCOUNT_PANELS } from './ACCOUNT_PANELS';
import { useAccountPanels } from './useAccountPanels';

jest.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('useAccountPanels', () => {
  it('adds a tab for each account page a plugin offers after Valence’s own', async () => {
    jest.mocked(fetchPluginContributions).mockResolvedValue(
      somePluginContributions({
        pages: [
          ...somePluginContributions().pages,
          {
            pluginId: 'anilist',
            pluginName: 'AniList',
            pageId: 'admin',
            title: 'Admin',
            placement: 'admin',
            icon: null,
          },
          {
            pluginId: 'music',
            pluginName: 'Music import',
            pageId: 'import',
            title: 'Import',
            placement: 'account',
            icon: null,
          },
        ],
      }),
    );
    const { result } = await renderHook(() => useAccountPanels(), { wrapper: CacheScope });

    await waitFor(() => {
      expect(result.current.map((tab) => tab.id)).toEqual([
        ...ACCOUNT_PANELS.map((panel) => panel.id),
        'plugin:anilist:tracking',
        'plugin:music:import',
      ]);
    });
  });

  it('is Valence’s own tabs alone where the plugins cannot be asked', async () => {
    jest.mocked(fetchPluginContributions).mockRejectedValue(new Error('Away'));
    const { result } = await renderHook(() => useAccountPanels(), { wrapper: CacheScope });

    expect(result.current.map((tab) => tab.id)).toEqual(ACCOUNT_PANELS.map((panel) => panel.id));
  });
});
