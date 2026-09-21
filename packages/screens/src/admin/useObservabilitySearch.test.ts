import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useObservabilitySearch } from './useObservabilitySearch';
import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';

const LOGS: ObservabilitySearch = { view: 'logs' };

describe('useObservabilitySearch', () => {
  it('holds what the address says', () => {
    const { result } = renderHook(() => useObservabilitySearch({ view: 'logs' }));

    expect(result.current[0]).toStrictEqual({ view: 'logs' });
  });

  it('shows a change at once, and hands it to the address', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useObservabilitySearch({ view: 'logs' }, onChange));

    act(() => {
      result.current[1]({ range: '7d' });
    });

    expect(result.current[0]).toStrictEqual({ view: 'logs', range: '7d' });
    expect(onChange).toHaveBeenCalledWith({ range: '7d' });
  });

  it('takes a field off when it is changed to nothing', () => {
    const { result } = renderHook(() => useObservabilitySearch({ view: 'logs', q: 'level:error' }));

    act(() => {
      result.current[1]({ q: undefined });
    });

    expect(result.current[0]).toStrictEqual({ view: 'logs' });
  });

  it('takes up what the address says when it says something different', () => {
    const { result, rerender } = renderHook(
      ({ given }: { given: ObservabilitySearch }) => useObservabilitySearch(given),
      { initialProps: { given: LOGS } },
    );

    act(() => {
      result.current[1]({ range: '7d' });
    });

    rerender({ given: { view: 'health' } });

    expect(result.current[0]).toStrictEqual({ view: 'health' });
  });

  it('keeps what it holds when the address only says it back', () => {
    const { result, rerender } = renderHook(
      ({ given }: { given: ObservabilitySearch }) => useObservabilitySearch(given),
      { initialProps: { given: LOGS } },
    );

    act(() => {
      result.current[1]({ range: '7d' });
    });

    rerender({ given: { view: 'logs', range: '7d' } });

    expect(result.current[0]).toStrictEqual({ view: 'logs', range: '7d' });
  });

  it('works where there is no address to hand a change to', () => {
    const { result } = renderHook(() => useObservabilitySearch({}));

    act(() => {
      result.current[1]({ view: 'health' });
    });

    expect(result.current[0]).toStrictEqual({ view: 'health' });
  });
});
