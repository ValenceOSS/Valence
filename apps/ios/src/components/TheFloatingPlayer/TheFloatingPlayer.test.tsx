import { act, render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValencePhone/music/thePhonesMusicPlayer';
import { TheFloatingPlayer } from './TheFloatingPlayer';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheFloatingPlayer', () => {
  it('carries what is playing over a page of the music library', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1)], 0);
    });
    const drawn = await render(<TheFloatingPlayer isShown onOpen={jest.fn()} />, {
      wrapper: CacheScope,
    });

    expect(drawn.getByText('Track 1')).toBeTruthy();
  });
});
