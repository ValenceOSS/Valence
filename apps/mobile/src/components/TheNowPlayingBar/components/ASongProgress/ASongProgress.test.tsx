import { act, render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ASongProgress } from './ASongProgress';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('ASongProgress', () => {
  it('follows how far through the song playing here it is', async () => {
    await act(() => {
      thePhonesMusicPlayer().play([aTrack(1)], 0);
    });

    await render(<ASongProgress />, { wrapper: CacheScope });

    expect(theDrawnRoot()).toHaveProp('accessibilityElementsHidden', true);
    expect(theDrawnRoot().children).toHaveLength(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ASongProgress.displayName).toBe('ASongProgress');
  });
});
