import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchAlbums, fetchArtists, fetchLiked } from '@ValenceClient/music/fetchMusic';
import { fetchPlaylists } from '@ValenceClient/music/fetchPlaylists';
import { fetchMixes } from '@ValenceClient/music/fetchMixes';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { aPlaylist } from '@ValenceMobile/testing/aPlaylist';
import { TheMusic } from './TheMusic';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  fetchAlbums: jest.fn(),
  fetchArtists: jest.fn(),
  fetchLiked: jest.fn(),
}));
jest.mock('@ValenceClient/music/fetchPlaylists');
jest.mock('@ValenceClient/music/fetchMixes');

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchAlbums).mockResolvedValue([anAlbum()]);
  jest.mocked(fetchArtists).mockResolvedValue([]);
  jest.mocked(fetchLiked).mockResolvedValue([]);
  jest.mocked(fetchPlaylists).mockResolvedValue([aPlaylist()]);
  jest.mocked(fetchMixes).mockResolvedValue([]);
});

const theFirst = <T,>(found: T[]): T => {
  const [first] = found;

  if (first === undefined) {
    throw new Error('Nothing was found.');
  }

  return first;
};

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
        onMix={jest.fn()}
        onAllAlbums={jest.fn()}
        onAllArtists={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    await drawn.findAllByText('Road trip');
    await userEvent.press(theFirst(drawn.getAllByText('Road trip')));
    await userEvent.press(theFirst(drawn.getAllByText('Liked songs')));
    await userEvent.press(theFirst(drawn.getAllByText('Even In Arcadia')));

    expect(onPlaylist).toHaveBeenCalledWith(aPlaylist().id);
    expect(onLiked).toHaveBeenCalled();
    expect(onAlbum).toHaveBeenCalledWith(anAlbum().id);
  });

  it('offers the mixes made for this profile today, under Made for you', async () => {
    jest.mocked(fetchMixes).mockResolvedValue([
      {
        id: 'decade-2020',
        kind: 'decade',
        title: '2020s Mix',
        detail: 'Music from the 2020s',
        trackCount: 30,
        coverAlbumIds: [],
      },
    ]);
    const onMix = jest.fn();
    const drawn = await render(
      <TheMusic
        header={null}
        onAlbum={jest.fn()}
        onArtist={jest.fn()}
        onPlaylist={jest.fn()}
        onLiked={jest.fn()}
        onMix={onMix}
        onAllAlbums={jest.fn()}
        onAllArtists={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('Made for you')).toBeTruthy();

    await userEvent.press(drawn.getByText('2020s Mix'));

    expect(onMix).toHaveBeenCalledWith('decade-2020');
  });
});
