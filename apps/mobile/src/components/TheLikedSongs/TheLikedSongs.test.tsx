import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchLiked } from '@ValenceClient/music/fetchMusic';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { TheLikedSongs } from './TheLikedSongs';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  fetchLiked: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheLikedSongs', () => {
  it('lists the songs this profile has liked', async () => {
    jest.mocked(fetchLiked).mockResolvedValue([aTrack(1), aTrack(2)]);
    const drawn = await render(
      <TheLikedSongs onAlbum={jest.fn()} onArtist={jest.fn()} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('Track 1')).toBeTruthy();
    expect(drawn.getByText('Track 2')).toBeTruthy();
  });
});
