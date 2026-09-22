import { act, renderHook } from '@testing-library/react-native';
import { useSettled } from './useSettled';

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useSettled', () => {
  it('starts with the value it was given', async () => {
    const held = await renderHook(() => useSettled('sev', 250));

    expect(held.result.current).toBe('sev');
  });

  it('holds the old value while it is still changing', async () => {
    const held = await renderHook(({ typed }: { typed: string }) => useSettled(typed, 250), {
      initialProps: { typed: 's' },
    });

    await held.rerender({ typed: 'se' });
    await act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(held.result.current).toBe('s');
  });

  it('takes the new value once it has held still', async () => {
    const held = await renderHook(({ typed }: { typed: string }) => useSettled(typed, 250), {
      initialProps: { typed: 's' },
    });

    await held.rerender({ typed: 'severance' });
    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(held.result.current).toBe('severance');
  });

  it('never settles on something typed on the way past', async () => {
    const held = await renderHook(({ typed }: { typed: string }) => useSettled(typed, 250), {
      initialProps: { typed: 's' },
    });

    await held.rerender({ typed: 'se' });
    await act(() => {
      jest.advanceTimersByTime(200);
    });
    await held.rerender({ typed: 'sev' });
    await act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(held.result.current).toBe('s');
  });
});
