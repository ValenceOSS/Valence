import { act, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';
import { aWatchPartyStateWith } from '@ValenceClient/testing/aWatchPartyStateWith';
import { setListeningParty } from '@ValenceClient/party/listeningParty';
import { TheMusicPlayer } from './TheMusicPlayer';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  setListeningParty(null);
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

  it('steps shuffle through on, smart and off, saying what the next press does', async () => {
    await act(() => {
      thePhonesMusicPlayer().stop();
      thePhonesMusicPlayer().play([aTrack(1), aTrack(2)], 0);
    });
    const drawn = await render(aPlayer(), { wrapper: CacheScope });

    await userEvent.press(drawn.getByRole('button', { name: 'Shuffle' }));

    expect(
      drawn.getByRole('button', { name: 'Smart shuffle' }).props.accessibilityState,
    ).toMatchObject({ selected: true });

    await userEvent.press(drawn.getByRole('button', { name: 'Smart shuffle' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Stop shuffling' }));

    expect(drawn.getByRole('button', { name: 'Shuffle' }).props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it('hands the song to the host of somebody else’s listening party', async () => {
    await act(() => {
      thePhonesMusicPlayer().stop();
      thePhonesMusicPlayer().play([aTrack(1), aTrack(2)], 0, { isOrdered: true });
    });
    const send = jest.fn();

    await act(() => {
      setListeningParty({
        party: aWatchParty({ kind: 'listen', isPlaying: false }),
        hostName: 'Dan',
        mayChoose: false,
        mayPlayPause: true,
        maySeek: false,
        send,
      });
    });
    const drawn = await render(aPlayer(), { wrapper: CacheScope });

    expect(drawn.getByRole('button', { name: 'Next' }).props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await userEvent.press(drawn.getByRole('button', { name: /^(Play|Pause)$/u }));

    expect(send).toHaveBeenCalledWith(expect.objectContaining({ kind: 'play' }));
  });

  it('opens the listening party beside the other ways to send the music elsewhere', async () => {
    await act(() => {
      thePhonesMusicPlayer().stop();
      thePhonesMusicPlayer().play([aTrack(1)], 0);
    });
    const watchParty = aWatchPartyStateWith(jest.fn);
    const drawn = await render(
      <TheMusicPlayer
        onArtist={jest.fn()}
        onAlbum={jest.fn()}
        onBack={jest.fn()}
        watchParty={watchParty}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Listening party' }));
    await userEvent.press(drawn.getByLabelText('Start a listening party'));

    expect(watchParty.open).toHaveBeenCalledWith(aTrack(1).id, 'listen');
  });
});
