import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchArtists } from '@ValenceClient/music/fetchMusic';
import { anArtist } from '@ValenceMobile/testing/anArtist';
import { TheArtists } from './TheArtists';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  fetchArtists: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheArtists', () => {
  it('lists every artist, each opening their page', async () => {
    jest.mocked(fetchArtists).mockResolvedValue([anArtist()]);
    const onArtist = jest.fn();
    const drawn = await render(<TheArtists onArtist={onArtist} onBack={jest.fn()} />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByText('Sleep Token'));

    expect(onArtist).toHaveBeenCalledWith(anArtist().id);
  });
});
