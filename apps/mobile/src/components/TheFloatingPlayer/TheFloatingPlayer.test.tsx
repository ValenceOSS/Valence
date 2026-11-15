import { act, render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { tracksOf } from '@ValenceClient/books/tracksOf';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { aFakeAudiobookPlayer } from '@ValenceMobile/testing/aFakeAudiobookPlayer';
import { TheFloatingPlayer } from './TheFloatingPlayer';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';

jest.mock('@ValenceMobile/hooks/usePictureLights', () => {
  const { usePictureLights: actual } = jest.requireActual<{
    usePictureLights: typeof usePictureLights;
  }>('@ValenceMobile/hooks/usePictureLights');

  return { usePictureLights: jest.fn(actual) };
});

let mockFake = aFakeAudiobookPlayer();

jest.mock('@ValenceMobile/books/thePhonesAudiobookPlayer', () => ({
  thePhonesAudiobookPlayer: () => mockFake.player,
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  mockFake = aFakeAudiobookPlayer();
});

describe('TheFloatingPlayer', () => {
  it('carries what is playing over a page of the music library', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1)], 0);
    });
    const drawn = await render(<TheFloatingPlayer isShown liftedBy={0} onOpen={jest.fn()} />, {
      wrapper: CacheScope,
    });

    expect(drawn.getByText('Track 1')).toBeTruthy();
  });

  it('reads ahead the colours of the narrowed cover the player is lit by, not the whole one', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1)], 0);
    });
    await render(<TheFloatingPlayer isShown liftedBy={0} onOpen={jest.fn()} />, {
      wrapper: CacheScope,
    });

    expect(usePictureLights).toHaveBeenLastCalledWith(
      expect.stringMatching(/\/artwork\?size=small$/u),
    );
  });

  it('carries a book being heard too', async () => {
    thePhonesMusicPlayer().stop();

    const { book, chapters } = anAudiobook();

    await act(() => {
      mockFake.player.open(book, tracksOf(chapters), null);
    });
    const drawn = await render(<TheFloatingPlayer isShown liftedBy={0} onOpen={jest.fn()} />, {
      wrapper: CacheScope,
    });

    expect(drawn.getByText('Red Rising')).toBeTruthy();
  });
});
