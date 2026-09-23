import { act, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValencePhone/music/thePhonesMusicPlayer';
import { TheNowPlayingBar } from './TheNowPlayingBar';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheNowPlayingBar', () => {
  it('draws nothing while nothing is playing', async () => {
    thePhonesMusicPlayer().stop();
    const drawn = await render(<TheNowPlayingBar onOpen={jest.fn()} />, { wrapper: CacheScope });

    expect(drawn.toJSON()).toBeNull();
  });

  it('shows what is playing, and opens the player when pressed', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1)], 0);
    });
    const onOpen = jest.fn();
    const drawn = await render(<TheNowPlayingBar onOpen={onOpen} />, { wrapper: CacheScope });

    expect(drawn.getByText('Track 1')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Open the player' }));

    expect(onOpen).toHaveBeenCalled();
  });
});
