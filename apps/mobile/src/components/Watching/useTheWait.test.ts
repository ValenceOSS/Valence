import { act, renderHook } from '@testing-library/react-native';
import { useTheWait } from './useTheWait';

describe('useTheWait', () => {
  it('shows the ring while waiting, and does not finish it yet', async () => {
    const { result } = await renderHook(() => useTheWait(true));

    expect(result.current).toMatchObject({ isShown: true, isFinishing: false });
  });

  it('finishes the ring once the wait is over, and lets it go once whole', async () => {
    const { result, rerender } = await renderHook(
      ({ isWaiting }: { isWaiting: boolean }) => useTheWait(isWaiting),
      {
        initialProps: { isWaiting: true },
      },
    );

    await rerender({ isWaiting: false });

    expect(result.current).toMatchObject({ isShown: true, isFinishing: true });

    await act(() => {
      result.current.onFilled();
    });

    expect(result.current.isShown).toBe(false);
  });
});
