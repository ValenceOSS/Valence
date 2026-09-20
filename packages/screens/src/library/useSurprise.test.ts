import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSurprise } from './useSurprise';
import type { Surprise } from '@ValenceClient/library/pickAnything.types';

const A_SHOW: Surprise = { kind: 'show', showId: 'show-1' };

describe('useSurprise', () => {
  it('hands over what was chosen', async () => {
    const onFound = vi.fn();
    const { result } = renderHook(() => useSurprise(() => Promise.resolve(A_SHOW), onFound));

    await act(async () => {
      result.current();
      await Promise.resolve();
    });

    expect(onFound).toHaveBeenCalledWith(A_SHOW);
  });

  it('chooses one thing at a time however fast it is asked', async () => {
    let finish: (found: Surprise | null) => void = () => undefined;
    const pick = vi.fn(
      () =>
        new Promise<Surprise | null>((resolve) => {
          finish = resolve;
        }),
    );
    const onFound = vi.fn();
    const { result } = renderHook(() => useSurprise(pick, onFound));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(pick).toHaveBeenCalledTimes(1);

    await act(async () => {
      finish(A_SHOW);
      await Promise.resolve();
    });

    expect(onFound).toHaveBeenCalledTimes(1);
  });

  it('chooses again once the last choice has been made', async () => {
    const pick = vi.fn(() => Promise.resolve(A_SHOW));
    const { result } = renderHook(() => useSurprise(pick, vi.fn()));

    await act(async () => {
      result.current();
      await Promise.resolve();
    });
    await act(async () => {
      result.current();
      await Promise.resolve();
    });

    expect(pick).toHaveBeenCalledTimes(2);
  });

  it('says nothing when there was nothing to choose', async () => {
    const onFound = vi.fn();
    const { result } = renderHook(() => useSurprise(() => Promise.resolve(null), onFound));

    await act(async () => {
      result.current();
      await Promise.resolve();
    });

    expect(onFound).not.toHaveBeenCalled();
  });
});
