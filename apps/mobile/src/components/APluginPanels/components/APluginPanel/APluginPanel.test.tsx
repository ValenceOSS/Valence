import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchPluginSurface } from '@ValenceClient/plugins/fetchPluginSurface';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { APluginPanel } from './APluginPanel';

jest.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface: jest.fn() }));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

const props = {
  pluginId: 'anilist',
  pluginName: 'AniList',
  panelId: 'score',
  title: 'Score',
  on: 'title' as const,
  subjectId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
};

describe('APluginPanel', () => {
  it('boxes what the plugin drew, under its title and the plugin’s name', async () => {
    jest
      .mocked(fetchPluginSurface)
      .mockResolvedValue(SurfaceSchema.parse({ blocks: [{ type: 'text', text: '8.4' }] }));
    const drawn = await render(<APluginPanel {...props} />, { wrapper: CacheScope });

    expect(await drawn.findByText('8.4')).toBeTruthy();
    expect(drawn.getByText('Score')).toBeTruthy();
    expect(drawn.getByText('From AniList')).toBeTruthy();
  });

  it('leaves out a panel that cannot be read', async () => {
    jest.mocked(fetchPluginSurface).mockRejectedValue(new Error('Away'));
    const drawn = await render(<APluginPanel {...props} />, { wrapper: CacheScope });

    expect(drawn.toJSON()).toBeNull();
  });
});
