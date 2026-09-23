import { act, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValencePhone/music/thePhonesMusicPlayer';
import { TheMusicPlayer } from './TheMusicPlayer';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

const aPlayer = (onArtist = jest.fn(), onAlbum = jest.fn()) => (
  <TheMusicPlayer onArtist={onArtist} onAlbum={onAlbum} onBack={jest.fn()} />
);

describe('TheMusicPlayer', () => {
  it('says so while nothing is playing', async () => {
    thePhonesMusicPlayer().stop();
    const drawn = await render(aPlayer(), { wrapper: CacheScope });

    expect(drawn.getByText('Nothing is playing.')).toBeTruthy();
  });

  it('shows the song, opens its artist and its album, and skips on', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1), aTrack(2)], 0, { isOrdered: true });
    });
    const onArtist = jest.fn();
    const onAlbum = jest.fn();
    const drawn = await render(aPlayer(onArtist, onAlbum), { wrapper: CacheScope });

    expect(drawn.getByText('Track 1')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Open Sleep Token' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Open Even In Arcadia' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Next' }));

    expect(onArtist).toHaveBeenCalledWith(aTrack(1).artists[0]?.id);
    expect(onAlbum).toHaveBeenCalledWith(aTrack(1).album.id);
    expect(thePhonesMusicPlayer().read().current?.id).toBe(aTrack(2).id);
  });

  it('turns shuffle on, and shows it on', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1), aTrack(2)], 0);
    });
    const drawn = await render(aPlayer(), { wrapper: CacheScope });

    await userEvent.press(drawn.getByRole('button', { name: 'Shuffle' }));

    expect(drawn.getByRole('button', { name: 'Shuffle' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });
});
