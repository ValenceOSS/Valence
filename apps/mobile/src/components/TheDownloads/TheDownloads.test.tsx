import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchDownloads } from '@ValenceClient/downloads/fetchDownloads';
import { TheDownloads } from './TheDownloads';

jest.mock('@ValenceClient/downloads/fetchDownloads', () => ({
  ...jest.requireActual<object>('@ValenceClient/downloads/fetchDownloads'),
  fetchDownloads: jest.fn(),
}));

describe('TheDownloads', () => {
  it('says so where nothing has been downloaded', async () => {
    installPlatform(aFakePlatform());
    jest.mocked(fetchDownloads).mockResolvedValue([]);
    const drawn = await render(<TheDownloads onWatch={jest.fn()} />, { wrapper: CacheScope });

    expect(drawn.getByText('Downloads')).toBeTruthy();
    expect(await drawn.findByText('Nothing downloaded yet')).toBeTruthy();
  });
});
