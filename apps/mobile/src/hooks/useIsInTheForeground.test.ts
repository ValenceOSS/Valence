import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useIsInTheForeground } from './useIsInTheForeground';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useIsInTheForeground', () => {
  it('follows the app behind the app switcher and back', async () => {
    const listening = jest.spyOn(AppState, 'addEventListener');
    const { result } = await renderHook(() => useIsInTheForeground());

    expect(result.current).toBe(true);

    const told = listening.mock.calls[0]?.[1];

    await act(() => {
      told?.('inactive');
    });

    expect(result.current).toBe(false);

    await act(() => {
      told?.('background');
    });

    expect(result.current).toBe(false);

    await act(() => {
      told?.('active');
    });

    expect(result.current).toBe(true);
  });

  it('stops listening once nothing needs to know', async () => {
    const remove = jest.fn();

    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });

    const { unmount } = await renderHook(() => useIsInTheForeground());

    await unmount();

    expect(remove).toHaveBeenCalled();
  });
});
