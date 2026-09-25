import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchAlbum } from '@ValenceClient/music/fetchMusic';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { AnAlbum } from './AnAlbum';

jest.mock('@ValenceClient/music/fetchMusic', () => ({
  ...jest.requireActual<object>('@ValenceClient/music/fetchMusic'),
  fetchAlbum: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('AnAlbum', () => {
  it('shows the album, its songs, and a way to its artist', async () => {
    jest.mocked(fetchAlbum).mockResolvedValue({ album: anAlbum(), tracks: [aTrack(1), aTrack(2)] });
    const onArtist = jest.fn();
    const drawn = await render(
      <AnAlbum albumId={anAlbum().id} onAlbum={jest.fn()} onArtist={onArtist} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('Even In Arcadia')).toBeTruthy();
    expect(drawn.getByText('Track 2')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Sleep Token' }));

    expect(onArtist).toHaveBeenCalledWith(anAlbum().artist.id);
  });

  it('says so where the album cannot be read', async () => {
    jest.mocked(fetchAlbum).mockRejectedValue(new Error('gone'));
    const drawn = await render(
      <AnAlbum albumId="gone" onAlbum={jest.fn()} onArtist={jest.fn()} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('That album could not be read.')).toBeTruthy();
  });
});
