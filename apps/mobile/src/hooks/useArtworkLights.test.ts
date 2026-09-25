import { renderHook } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { useArtworkLights } from './useArtworkLights';

jest.mock('@ValenceMobile/hooks/usePictureLights', () => ({ usePictureLights: jest.fn(() => []) }));

describe('useArtworkLights', () => {
  it('reads its lights from the title’s backdrop on this server', async () => {
    installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));

    await renderHook(() => useArtworkLights('arrival'));

    expect(usePictureLights).toHaveBeenCalledWith(
      'http://one.local:8420/api/media/arrival/image/backdrop',
    );
  });

  it('reads nothing where there is no title', async () => {
    await renderHook(() => useArtworkLights(null));

    expect(usePictureLights).toHaveBeenLastCalledWith(null);
  });
});
