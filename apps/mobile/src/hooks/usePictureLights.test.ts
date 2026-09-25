import { renderHook } from '@testing-library/react-native';
import { usePictureLights } from './usePictureLights';

describe('usePictureLights', () => {
  it('lights nothing where there is no picture', async () => {
    const { result } = await renderHook(() => usePictureLights(null));

    expect(result.current).toEqual([]);
  });

  it('lights nothing on a build that cannot read a picture, rather than failing', async () => {
    const { result } = await renderHook(() => usePictureLights('http://one.local/cover.jpg'));

    expect(result.current).toEqual([]);
  });
});
