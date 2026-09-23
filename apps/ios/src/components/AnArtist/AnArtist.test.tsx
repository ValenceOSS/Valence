import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchArtist } from '@ValenceClient/music/fetchMusic';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { anAlbum } from '@ValencePhone/testing/anAlbum';
import { anArtist } from '@ValencePhone/testing/anArtist';
import { AnArtist } from './AnArtist';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  fetchArtist: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('AnArtist', () => {
  it('shows the artist, their popular songs and their albums', async () => {
    jest.mocked(fetchArtist).mockResolvedValue({
      artist: anArtist(),
      albums: [anAlbum()],
      appearsOn: [],
      popular: [aTrack(1)],
    });
    const onAlbum = jest.fn();
    const drawn = await render(
      <AnArtist
        artistId={anArtist().id}
        onAlbum={onAlbum}
        onArtist={jest.fn()}
        onBack={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findAllByText('Sleep Token')).not.toHaveLength(0);
    expect(drawn.getByText('Track 1')).toBeTruthy();

    await userEvent.press(drawn.getByText('Even In Arcadia'));

    expect(onAlbum).toHaveBeenCalledWith(anAlbum().id);
  });
});
