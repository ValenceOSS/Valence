import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchMix } from '@ValenceClient/music/fetchMixes';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { AMix } from './AMix';

jest.mock('@ValenceClient/music/fetchMixes');

const MIX = {
  id: 'decade-2020',
  kind: 'decade',
  title: '2020s Mix',
  detail: 'Music from the 2020s',
  trackCount: 2,
  coverAlbumIds: [],
  tracks: [aTrack(1), aTrack(2)],
} as const;

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('AMix', () => {
  it('lists a mix’s songs under its name, made by Valence', async () => {
    jest.mocked(fetchMix).mockResolvedValue({ ...MIX, tracks: [...MIX.tracks] });
    const drawn = await render(
      <AMix mixId="decade-2020" onAlbum={jest.fn()} onArtist={jest.fn()} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('2020s Mix')).toBeTruthy();
    expect(drawn.getByText('Made by Valence')).toBeTruthy();
    expect(drawn.getByText('Track 1')).toBeTruthy();
    expect(drawn.getByText('Track 2')).toBeTruthy();
  });

  it('plays the mix from its first song, saying it came from the mix', async () => {
    jest.mocked(fetchMix).mockResolvedValue({ ...MIX, tracks: [...MIX.tracks] });
    const playing = jest.spyOn(thePhonesMusicPlayer(), 'play').mockImplementation(() => undefined);
    const drawn = await render(
      <AMix mixId="decade-2020" onAlbum={jest.fn()} onArtist={jest.fn()} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    await userEvent.press(await drawn.findByText('Play'));

    expect(playing).toHaveBeenCalledWith(MIX.tracks, 0, {
      source: { kind: 'tracks', id: 'decade-2020', name: '2020s Mix' },
    });
    playing.mockRestore();
  });

  it('says there is no such mix where one from another day is asked for', async () => {
    jest.mocked(fetchMix).mockRejectedValue(new Error('Not here.'));
    const drawn = await render(
      <AMix mixId="decade-1950" onAlbum={jest.fn()} onArtist={jest.fn()} onBack={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('There’s no such mix today.')).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AMix.displayName).toBe('AMix');
  });
});
