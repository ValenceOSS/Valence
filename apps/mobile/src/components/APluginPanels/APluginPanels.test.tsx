import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { fetchPluginSurface } from '@ValenceClient/plugins/fetchPluginSurface';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { APluginPanels } from './APluginPanels';

jest.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: jest.fn(),
}));
jest.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface: jest.fn() }));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchPluginContributions).mockResolvedValue(somePluginContributions());
  jest
    .mocked(fetchPluginSurface)
    .mockResolvedValue(
      SurfaceSchema.parse({ blocks: [{ type: 'text', text: 'Episode 12 of 28' }] }),
    );
});

const SHOW = '3fa85f64-5717-4562-b3fc-2c963f66afa9';

describe('APluginPanels', () => {
  it('draws each plugin’s panel about the programme, named for its plugin', async () => {
    const drawn = await render(<APluginPanels on="series" subjectId={SHOW} />, {
      wrapper: CacheScope,
    });

    expect(await drawn.findByText('Episode 12 of 28')).toBeTruthy();
    expect(drawn.getByText('On AniList')).toBeTruthy();
    expect(drawn.getByText('From AniList')).toBeTruthy();
    expect(fetchPluginSurface).toHaveBeenCalledWith({
      kind: 'panel',
      pluginId: 'anilist',
      panelId: 'progress',
      on: 'series',
      subjectId: SHOW,
    });
  });

  it('draws nothing where no plugin adds a panel about it', async () => {
    const drawn = await render(<APluginPanels on="playlist" subjectId={SHOW} />, {
      wrapper: CacheScope,
    });

    expect(drawn.toJSON()).toBeNull();
  });
});
