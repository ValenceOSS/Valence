import { render, userEvent, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValencePhone/music/thePhonesMusicPlayer';
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
});
