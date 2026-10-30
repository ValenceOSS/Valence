import { renderHook } from '@testing-library/react-native';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { usePictureTint } from './usePictureTint';

jest.mock('@ValenceMobile/hooks/usePictureLights', () => ({ usePictureLights: jest.fn() }));

describe('usePictureTint', () => {
  it('has no tint where the picture gave no colour', async () => {
    jest.mocked(usePictureLights).mockReturnValue([]);

    const { result } = await renderHook(() => usePictureTint('https://image.example/a.jpg'));

    expect(result.current).toBeNull();
  });

  it('reads the picture it is given', async () => {
    jest.mocked(usePictureLights).mockReturnValue([]);

    await renderHook(() => usePictureTint('https://image.example/a.jpg'));

    expect(usePictureLights).toHaveBeenCalledWith('https://image.example/a.jpg');
  });
});
