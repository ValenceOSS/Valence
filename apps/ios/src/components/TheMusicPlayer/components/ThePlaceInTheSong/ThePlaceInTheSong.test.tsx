import { act, render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValencePhone/music/thePhonesMusicPlayer';
import { ThePlaceInTheSong } from './ThePlaceInTheSong';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('ThePlaceInTheSong', () => {
  it('shows the time gone, moving as the song does', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1), aTrack(2)], 0);
    });
    const drawn = await render(<ThePlaceInTheSong title="Track 1" />, { wrapper: CacheScope });

    await act(() => {
      thePhonesMusicPlayer().seek(75);
    });

    expect(drawn.getByText('1:15')).toBeTruthy();
  });
});
