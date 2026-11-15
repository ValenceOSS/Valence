import { render, userEvent, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { ATrackList } from './ATrackList';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('ATrackList', () => {
  it('plays from the song pressed, with the rest of the list after it', async () => {
    const drawn = await render(
      <ATrackList
        tracks={[aTrack(1), aTrack(2)]}
        source={{ kind: 'album', id: 'arcadia', name: 'Even In Arcadia' }}
        isAnAlbum
        onAlbum={jest.fn()}
        onArtist={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Play Track 2' }));

    await waitFor(() => {
      expect(thePhonesMusicPlayer().read().current?.id).toBe(aTrack(2).id);
    });
  });

  it('draws a song the library does not have in its place among the rest', async () => {
    const drawn = await render(
      <ATrackList
        tracks={[aTrack(1), aTrack(2)]}
        source={{ kind: 'playlist', id: 'mine', name: 'Mine' }}
        onAlbum={jest.fn()}
        onArtist={jest.fn()}
        missing={[
          { key: 'low-tide', before: 1, title: 'Low Tide', artist: 'Mara Quill', coverUrl: null },
        ]}
      />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('Low Tide')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Play Track 2' })).toBeTruthy();
  });

  it('hands its rows to a page that draws them only as they come near the screen', async () => {
    const tracks = Array.from({ length: 2_000 }, (_, at) => aTrack(at + 1));
    const drawn = await render(
      <ATrackList
        tracks={tracks}
        source={{ kind: 'liked', id: null, name: 'Liked Songs' }}
        onAlbum={jest.fn()}
        onArtist={jest.fn()}
        drawnIn={(rows) => (
          <Screen scrolls rows={rows}>
            {null}
          </Screen>
        )}
      />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByRole('button', { name: 'Play Track 1' })).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Play Track 2000' })).toBeNull();
  });
});
