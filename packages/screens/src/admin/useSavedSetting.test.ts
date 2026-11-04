import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSavedSetting } from './useSavedSetting';

const notified = vi.hoisted(() => ({ worked: vi.fn(), failed: vi.fn() }));

vi.mock('@ValenceUI/notify', () => ({ notify: notified }));

const WORDS = { done: 'Saved.', failed: 'Not saved.' };

describe('useSavedSetting', () => {
  afterEach(() => {
    vi.useRealTimers();
    notified.worked.mockClear();
    notified.failed.mockClear();
  });

  it('shows a change at once, saves it and says so', async () => {
    const save = vi.fn(() => Promise.resolve(true));
    const onSaved = vi.fn();
    const { result } = renderHook(() => useSavedSetting(false, save, { ...WORDS, onSaved }));

    await act(async () => {
      result.current[1](true);
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(true);
    expect(save).toHaveBeenCalledWith(true);
    expect(notified.worked).toHaveBeenCalledWith('Saved.');
    expect(onSaved).toHaveBeenCalled();
  });

  it('puts the saved value back where the save fails', async () => {
    const { result } = renderHook(() =>
      useSavedSetting('one', () => Promise.resolve(false), WORDS),
    );

    await act(async () => {
      result.current[1]('two');
      await Promise.resolve();
    });

    expect(result.current[0]).toBe('one');
    expect(notified.failed).toHaveBeenCalledWith('Not saved.');
  });

  it('waits for typing to stop before saving, given a delay', async () => {
    vi.useFakeTimers();
    const save = vi.fn(() => Promise.resolve(true));
    const { result } = renderHook(() => useSavedSetting('', save, { ...WORDS, delayMs: 500 }));

    act(() => {
      result.current[1]('Va');
    });
    act(() => {
      result.current[1]('Valence');
    });

    expect(result.current[0]).toBe('Valence');
    expect(save).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('Valence');
  });

  it('follows the saved value once it catches up', async () => {
    const { result, rerender } = renderHook(
      ({ saved }) => useSavedSetting(saved, () => Promise.resolve(true), WORDS),
      { initialProps: { saved: 'one' } },
    );

    await act(async () => {
      result.current[1]('two');
      await Promise.resolve();
    });
    rerender({ saved: 'two' });
    rerender({ saved: 'three' });

    expect(result.current[0]).toBe('three');
  });

  it('still saves a held change when the page is left before the wait is over', () => {
    vi.useFakeTimers();
    const save = vi.fn(() => Promise.resolve(true));
    const { result, unmount } = renderHook(() =>
      useSavedSetting('one', save, { ...WORDS, delayMs: 700 }),
    );

    act(() => {
      result.current[1]('two');
    });
    unmount();

    expect(save).toHaveBeenCalledWith('two');
  });

  it('gives way to what the server answers once saved, even where the server tidied it', async () => {
    const { result, rerender } = renderHook(
      ({ saved }: { saved: string }) => useSavedSetting(saved, () => Promise.resolve(true), WORDS),
      { initialProps: { saved: 'Den' } },
    );

    await act(async () => {
      result.current[1]('Den ');
      await Promise.resolve();
    });

    rerender({ saved: 'Den' });

    expect(result.current[0]).toBe('Den ');

    rerender({ saved: 'Loft' });

    expect(result.current[0]).toBe('Loft');
  });
});
