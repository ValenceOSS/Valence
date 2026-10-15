import { act, renderHook } from '@testing-library/react-native';
import { useTapsOnThePicture } from './useTapsOnThePicture';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useTapsOnThePicture', () => {
  it('counts one tap as a tap, once no second follows', async () => {
    const onTap = jest.fn();
    const onLeap = jest.fn();
    const { result } = await renderHook(() => useTapsOnThePicture(400, onTap, onLeap));

    await act(() => {
      result.current.tapped({ x: 300, y: 100 });
    });
    await act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(onTap).toHaveBeenCalled();
    expect(onLeap).not.toHaveBeenCalled();
  });

  it('leaps forward on a double tap at the right, and back at the left', async () => {
    const onLeap = jest.fn();
    const { result } = await renderHook(() => useTapsOnThePicture(400, jest.fn(), onLeap));

    await act(() => {
      result.current.tapped({ x: 300, y: 100 });
      result.current.tapped({ x: 300, y: 100 });
    });

    expect(onLeap).toHaveBeenLastCalledWith(10);
    expect(result.current.leap?.way).toBe('forward');
  });

  it('tells a single tap in the middle third apart from one at either side', async () => {
    const onTap = jest.fn();
    const onMiddleTap = jest.fn();
    const { result } = await renderHook(() =>
      useTapsOnThePicture(300, onTap, jest.fn(), onMiddleTap),
    );

    await act(() => {
      result.current.tapped({ x: 150, y: 100 });
    });
    await act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(onMiddleTap).toHaveBeenCalledTimes(1);
    expect(onTap).not.toHaveBeenCalled();

    await act(() => {
      result.current.tapped({ x: 20, y: 100 });
    });
    await act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(onTap).toHaveBeenCalledTimes(1);
  });
});
