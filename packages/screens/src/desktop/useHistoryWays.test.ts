import { act, renderHook } from '@testing-library/react';
import { createMemoryHistory } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { useHistoryWays } from './useHistoryWays';

describe('useHistoryWays', () => {
  it('goes nowhere from the first page of a window', () => {
    const history = createMemoryHistory({ initialEntries: ['/'] });
    const { result } = renderHook(() => useHistoryWays(history));

    expect(result.current).toMatchObject({ canGoBack: false, canGoForward: false });
  });

  it('goes back once a page has been opened, and forward again once it has gone back', () => {
    const history = createMemoryHistory({ initialEntries: ['/'] });
    const { result } = renderHook(() => useHistoryWays(history));

    act(() => {
      history.push('/admin');
    });

    expect(result.current).toMatchObject({ canGoBack: true, canGoForward: false });

    act(() => {
      result.current.back();
    });

    expect(history.location.pathname).toBe('/');
    expect(result.current).toMatchObject({ canGoBack: false, canGoForward: true });

    act(() => {
      result.current.forward();
    });

    expect(history.location.pathname).toBe('/admin');
    expect(result.current).toMatchObject({ canGoBack: true, canGoForward: false });
  });

  it('forgets what lay ahead once a new page is opened from further back', () => {
    const history = createMemoryHistory({ initialEntries: ['/'] });
    const { result } = renderHook(() => useHistoryWays(history));

    act(() => {
      history.push('/admin');
      history.push('/admin/logs');
    });
    act(() => {
      result.current.back();
    });
    act(() => {
      history.push('/admin/users');
    });

    expect(result.current).toMatchObject({ canGoBack: true, canGoForward: false });
  });
});
