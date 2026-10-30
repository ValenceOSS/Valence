import { renderHook } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { usePictureTint } from '@ValenceMobile/hooks/usePictureTint';
import { useArtworkTint } from './useArtworkTint';

jest.mock('@ValenceMobile/hooks/usePictureTint', () => ({ usePictureTint: jest.fn() }));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(usePictureTint).mockReturnValue(null);
});

describe('useArtworkTint', () => {
  it('reads nothing while there is no artwork', async () => {
    await renderHook(() => useArtworkTint(null));

    expect(usePictureTint).toHaveBeenCalledWith(null);
  });

  it('reads the backdrop of what it is given', async () => {
    await renderHook(() => useArtworkTint('one'));

    expect(jest.mocked(usePictureTint).mock.calls.at(-1)?.[0]).toContain('backdrop');
  });
});
