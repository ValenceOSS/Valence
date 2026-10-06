import { renderHook, waitFor } from '@testing-library/react-native';
import { usePictureLights } from '@ValenceTv/native/usePictureLights';

const mockRead = jest.fn<Promise<object[]>, [string, Record<string, string>]>();

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: () => ({
    readLights: (url: string, headers: Record<string, string>) => mockRead(url, headers),
  }),
}));

const LIGHT = { colour: 'rgb(200, 80, 40)', at: '8% 10%' };

describe('usePictureLights', () => {
  beforeEach(() => {
    mockRead.mockReset();
  });

  it('reads a picture’s lights, signed as the viewer', async () => {
    mockRead.mockResolvedValue([LIGHT]);

    const { result } = await renderHook(() =>
      usePictureLights('https://valence.test/a.jpg', { authorization: 'Bearer x' }),
    );

    await waitFor(() => {
      expect(result.current).toEqual([LIGHT]);
    });
    expect(mockRead).toHaveBeenCalledWith('https://valence.test/a.jpg', {
      authorization: 'Bearer x',
    });
  });

  it('reads nothing where there is no picture', async () => {
    const { result } = await renderHook(() => usePictureLights(null, {}));

    expect(result.current).toEqual([]);
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('gives no lights where what is read cannot be understood', async () => {
    mockRead.mockResolvedValue([{ colour: 3 }]);

    const { result } = await renderHook(() => usePictureLights('https://valence.test/b.jpg', {}));

    await waitFor(() => {
      expect(mockRead).toHaveBeenCalled();
    });
    expect(result.current).toEqual([]);
  });
});
