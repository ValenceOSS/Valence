import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchPlaylist } from '@ValenceClient/music/fetchPlaylists';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { aPlaylist } from '@ValencePhone/testing/aPlaylist';
import { APlaylist } from './APlaylist';

jest.mock('@ValenceClient/music/fetchPlaylists');

const anEntry = (n: number) => ({
  id: `00000000-0000-4000-8000-0000000000e${n.toString()}`,
  position: n,
  addedAt: '2026-09-01T00:00:00.000Z',
  item: {
    id: aTrack(n).id,
    kind: 'song' as const,
    title: aTrack(n).title,
    subtitle: null,
    durationSeconds: 200,
    track: aTrack(n),
  },
});

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('APlaylist', () => {
  it('shows the playlist and its songs', async () => {
    jest.mocked(fetchPlaylist).mockResolvedValue({
      playlist: aPlaylist(),
      entries: [anEntry(1), anEntry(2)],
    });
    const drawn = await render(
      <APlaylist
        playlistId={aPlaylist().id}
        onAlbum={jest.fn()}
        onArtist={jest.fn()}
        onBack={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('Road trip')).toBeTruthy();
    expect(drawn.getByText('Track 2')).toBeTruthy();
  });
});
