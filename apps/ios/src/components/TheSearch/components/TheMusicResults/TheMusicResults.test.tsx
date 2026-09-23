import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { searchMusic } from '@ValenceClient/music/fetchMusic';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { anAlbum } from '@ValencePhone/testing/anAlbum';
import { TheMusicResults } from './TheMusicResults';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  searchMusic: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

const results = (isOnItsOwn: boolean, onAlbum = jest.fn()) => (
  <TheMusicResults
    asked="arcadia"
    isOnItsOwn={isOnItsOwn}
    onAlbum={onAlbum}
    onArtist={jest.fn()}
    onPlaylist={jest.fn()}
  />
);

describe('TheMusicResults', () => {
  it('shows the songs and albums that match, each opening', async () => {
    jest.mocked(searchMusic).mockResolvedValue({
      tracks: [aTrack(1)],
      albums: [anAlbum()],
      artists: [],
      playlists: [],
    });
    const onAlbum = jest.fn();
    const drawn = await render(results(true, onAlbum), { wrapper: CacheScope });

    expect(await drawn.findByText('Track 1')).toBeTruthy();

    await userEvent.press(drawn.getByText('Even In Arcadia'));

    expect(onAlbum).toHaveBeenCalledWith(anAlbum().id);
  });

  it('says nothing matches where it is all that was asked for', async () => {
    jest
      .mocked(searchMusic)
      .mockResolvedValue({ tracks: [], albums: [], artists: [], playlists: [] });
    const drawn = await render(results(true), { wrapper: CacheScope });

    expect(await drawn.findByText('Nothing matches “arcadia”')).toBeTruthy();
  });
});
