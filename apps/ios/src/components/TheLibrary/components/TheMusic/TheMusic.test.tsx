import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchAlbums, fetchArtists, fetchLiked } from '@ValenceClient/music/fetchMusic';
import { fetchPlaylists } from '@ValenceClient/music/fetchPlaylists';
import { anAlbum } from '@ValencePhone/testing/anAlbum';
import { aPlaylist } from '@ValencePhone/testing/aPlaylist';
import { TheMusic } from './TheMusic';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  fetchAlbums: jest.fn(),
  fetchArtists: jest.fn(),
  fetchLiked: jest.fn(),
}));
jest.mock('@ValenceClient/music/fetchPlaylists');

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchAlbums).mockResolvedValue([anAlbum()]);
  jest.mocked(fetchArtists).mockResolvedValue([]);
  jest.mocked(fetchLiked).mockResolvedValue([]);
  jest.mocked(fetchPlaylists).mockResolvedValue([aPlaylist()]);
});

describe('TheMusic', () => {
  it('offers liked songs, this profile’s playlists, and what was added lately', async () => {
    const onLiked = jest.fn();
    const onPlaylist = jest.fn();
    const onAlbum = jest.fn();
    const drawn = await render(
      <TheMusic
        header={null}
        onAlbum={onAlbum}
        onArtist={jest.fn()}
        onPlaylist={onPlaylist}
        onLiked={onLiked}
        onAllAlbums={jest.fn()}
        onAllArtists={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(await drawn.findByText('Road trip'));
    await userEvent.press(drawn.getByText('Liked songs'));
    await userEvent.press(drawn.getByText('Even In Arcadia'));

    expect(onPlaylist).toHaveBeenCalledWith(aPlaylist().id);
    expect(onLiked).toHaveBeenCalled();
    expect(onAlbum).toHaveBeenCalledWith(anAlbum().id);
  });
});
