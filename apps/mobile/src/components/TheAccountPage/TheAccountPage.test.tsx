import { Alert } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchSession } from '@ValenceClient/session/auth';
import { aSessionUser } from '@ValenceMobile/testing/aSessionUser';
import { fetchPluginSurface } from '@ValenceClient/plugins/fetchPluginSurface';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import { TheAccountPage } from './TheAccountPage';

jest.mock('@ValenceClient/session/auth', () => ({
  ...jest.requireActual<object>('@ValenceClient/session/auth'),
  fetchSession: jest.fn(),
}));

jest.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface: jest.fn() }));
jest.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: jest.fn(),
}));

const mockWithdrawn: {
  pluginId: string | null;
  tell: (change: { pluginId: string; change: 'disabled' | 'removed' }) => void;
} = { pluginId: null, tell: () => undefined };

jest.mock('@ValenceClient/plugins/usePluginWithdrawn', () => ({
  usePluginWithdrawn: (
    pluginId: string | null,
    onWithdrawn: (change: { pluginId: string; change: 'disabled' | 'removed' }) => void,
  ) => {
    mockWithdrawn.pluginId = pluginId;
    mockWithdrawn.tell = onWithdrawn;
  },
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchSession).mockResolvedValue(aSessionUser());
  jest.mocked(fetchPluginContributions).mockResolvedValue(somePluginContributions());
});

describe('TheAccountPage', () => {
  it('draws a plugin’s page, under the title the plugin gave it', async () => {
    jest
      .mocked(fetchPluginSurface)
      .mockResolvedValue(
        SurfaceSchema.parse({ blocks: [{ type: 'text', text: 'Connect your AniList.' }] }),
      );
    const drawn = await render(
      <TheAccountPage panel="plugin:anilist:tracking" onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('Connect your AniList.')).toBeTruthy();
    expect(await drawn.findByText('Anime tracking')).toBeTruthy();
    expect(fetchPluginSurface).toHaveBeenCalledWith({
      kind: 'page',
      pluginId: 'anilist',
      pageId: 'tracking',
    });
  });

  it('goes back, and says why, when an administrator removes the plugin', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const onBack = jest.fn();

    jest
      .mocked(fetchPluginSurface)
      .mockResolvedValue(SurfaceSchema.parse({ blocks: [{ type: 'divider' }] }));
    await render(<TheAccountPage panel="plugin:anilist:tracking" onBack={onBack} />, {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      mockWithdrawn.tell({ pluginId: 'anilist', change: 'removed' });

      expect(alert).toHaveBeenLastCalledWith('AniList was removed by an administrator.');
    });

    expect(onBack).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TheAccountPage.displayName).toBe('TheAccountPage');
  });
});
