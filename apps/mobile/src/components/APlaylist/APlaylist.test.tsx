import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchPlaylist } from '@ValenceClient/music/fetchPlaylists';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { aPlaylist } from '@ValenceMobile/testing/aPlaylist';
import { APlaylist } from './APlaylist';

jest.mock('@ValenceClient/music/fetchPlaylists');

const mayRequestMusic = { now: false };

jest.mock('@ValenceClient/requests/useMayRequestMusic', () => ({
  useMayRequestMusic: () => mayRequestMusic.now,
}));

const anEntry = (n: number) => ({
  id: `00000000-0000-4000-8000-0000000000e${n.toString()}`,
  position: n,
  addedAt: '2026-09-01T00:00:00.000Z',
  missing: null,
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
  mayRequestMusic.now = false;
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

  it('draws a song the library does not have in its place among the songs, and counts it', async () => {
    jest.mocked(fetchPlaylist).mockResolvedValue({
      playlist: aPlaylist(),
      entries: [
        anEntry(1),
        {
          id: '00000000-0000-4000-8000-0000000000f2',
          position: 1.5,
          addedAt: '2026-09-01T00:00:00.000Z',
          item: null,
          missing: {
            title: 'Low Tide',
            artist: 'Mara Quill',
            album: null,
            releaseId: null,
            coverUrl: null,
          },
        },
        anEntry(2),
      ],
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

    expect(await drawn.findByText('Low Tide')).toBeTruthy();
    expect(drawn.getByText('Mara Quill · Not in your library')).toBeTruthy();
    expect(drawn.getByText(/1 song not in your library/u)).toBeTruthy();

    expect(drawn.getAllByText(/^(Track \d|Low Tide)$/u)).toEqual([
      drawn.getByText('Track 1'),
      drawn.getByText('Low Tide'),
      drawn.getByText('Track 2'),
    ]);
    expect(drawn.queryByText('Request missing songs')).toBeNull();
  });

  it('offers somebody who may ask for music to request every missing song’s album', async () => {
    mayRequestMusic.now = true;
    jest.mocked(fetchPlaylist).mockResolvedValue({
      playlist: aPlaylist(),
      entries: [
        anEntry(1),
        {
          id: '00000000-0000-4000-8000-0000000000f2',
          position: 2,
          addedAt: '2026-09-01T00:00:00.000Z',
          item: null,
          missing: {
            title: 'Low Tide',
            artist: 'Mara Quill',
            album: 'Coastal',
            releaseId: null,
            coverUrl: null,
          },
        },
      ],
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

    expect(await drawn.findByText('Request missing songs')).toBeTruthy();
  });

  it('opens on requesting its missing songs where the notice that their albums were found leads', async () => {
    mayRequestMusic.now = true;
    jest.mocked(fetchPlaylist).mockResolvedValue({ playlist: aPlaylist(), entries: [anEntry(1)] });
    const drawn = await render(
      <APlaylist
        playlistId={aPlaylist().id}
        isRequestingMissing
        onAlbum={jest.fn()}
        onArtist={jest.fn()}
        onBack={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(
      await drawn.findByText(
        'Requests the albums that the songs not in your library are on. Untick any you don’t want.',
      ),
    ).toBeTruthy();
  });
});
