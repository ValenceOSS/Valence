import { act, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { TheUpNext } from './TheUpNext';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheUpNext', () => {
  it('lists what plays after this, and skips to one when pressed', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1), aTrack(2), aTrack(3)], 0, { isOrdered: true });
    });
    const drawn = await render(<TheUpNext />, { wrapper: CacheScope });

    expect(drawn.getByText('Track 3')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Play Track 3 now' }));

    expect(thePhonesMusicPlayer().read().current?.id).toBe(aTrack(3).id);
  });
});
