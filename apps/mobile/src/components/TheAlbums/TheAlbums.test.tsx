import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchAlbums } from '@ValenceClient/music/fetchMusic';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { TheAlbums } from './TheAlbums';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  fetchAlbums: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheAlbums', () => {
  it('lists every album, each opening its page', async () => {
    jest.mocked(fetchAlbums).mockResolvedValue([anAlbum()]);
    const onAlbum = jest.fn();
    const drawn = await render(<TheAlbums onAlbum={onAlbum} onBack={jest.fn()} />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('Even In Arcadia'));

    expect(onAlbum).toHaveBeenCalledWith(anAlbum().id);
  });
});
