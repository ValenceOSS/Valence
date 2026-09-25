import { act, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { thePhonesMusicPlayer } from '@ValencePhone/music/thePhonesMusicPlayer';
import { aFakeAudiobookPlayer } from '@ValencePhone/testing/aFakeAudiobookPlayer';
import { TheNowPlayingBar } from './TheNowPlayingBar';

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValencePhone/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  mockFake = aFakeAudiobookPlayer();
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

    expect(onOpen).toHaveBeenCalledWith('music');
  });

  it('shows the book being heard instead, going on thirty seconds and opening its player', async () => {
    const { book, chapters } = anAudiobook();

    await act(() => {
      mockFake.player.open(book, tracksOf(chapters), null);
      mockFake.audio.fire('loadedmetadata');
      mockFake.audio.fire('playing');
    });
    const onOpen = jest.fn();
    const drawn = await render(<TheNowPlayingBar onOpen={onOpen} />, { wrapper: CacheScope });

    expect(drawn.getByText('Red Rising')).toBeTruthy();
    expect(drawn.getByText('Pierce Brown')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'On 30 seconds' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Open the player' }));

    expect(mockFake.player.read().bookPositionSeconds).toBe(30);
    expect(onOpen).toHaveBeenCalledWith('book');
  });
});
