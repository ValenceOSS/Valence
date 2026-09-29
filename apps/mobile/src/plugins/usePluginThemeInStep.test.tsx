import { renderHook, waitFor } from '@testing-library/react-native';
import { installPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aPluginTheme } from '@ValenceClient/testing/aPluginTheme';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { choosePluginTheme, chosenPluginTheme } from '@ValenceClient/plugins/pluginThemeChoice';
import { keepPluginTheme } from '@ValenceClient/plugins/keepPluginTheme';
import { keptPluginTheme } from '@ValenceClient/plugins/keptPluginTheme';
import { usePluginThemeInStep } from './usePluginThemeInStep';

jest.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('usePluginThemeInStep', () => {
  it('keeps the colours of the chosen theme as the server now offers them', async () => {
    jest.mocked(fetchPluginContributions).mockResolvedValue(somePluginContributions());
    choosePluginTheme('night-sky/midnight');

    await renderHook(() => usePluginThemeInStep(), { wrapper: CacheScope });

    await waitFor(() => {
      expect(keptPluginTheme('night-sky/midnight')?.dark?.accent).toBe('#7c9cff');
    });
  });

  it('lets go of a theme whose plugin no longer offers it', async () => {
    jest
      .mocked(fetchPluginContributions)
      .mockResolvedValue(somePluginContributions({ themes: [] }));
    keepPluginTheme('gone', aPluginTheme());
    choosePluginTheme('gone/midnight');

    await renderHook(() => usePluginThemeInStep(), { wrapper: CacheScope });

    await waitFor(() => {
      expect(chosenPluginTheme()).toBeNull();
    });
    expect(platformInUse().store.read('valence.pluginThemeColours')).toBeNull();
  });

  it('changes nothing while the server cannot be asked', async () => {
    jest.mocked(fetchPluginContributions).mockRejectedValue(new Error('Away'));
    choosePluginTheme('night-sky/midnight');

    await renderHook(() => usePluginThemeInStep(), { wrapper: CacheScope });

    expect(chosenPluginTheme()).toBe('night-sky/midnight');
  });
});
