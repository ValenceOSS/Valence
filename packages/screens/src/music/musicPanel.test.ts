import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setMusicPanel, useMusicPanel } from './musicPanel';

afterEach(() => {
  setMusicPanel(null);
});

describe('musicPanel', () => {
  it('has nothing open to begin with', () => {
    const { result } = renderHook(() => useMusicPanel());

    expect(result.current).toBeNull();
  });

  it('opens a panel wherever it is read', () => {
    const { result } = renderHook(() => useMusicPanel());

    act(() => {
      setMusicPanel('queue');
    });

    expect(result.current).toBe('queue');
  });

  it('closes it again', () => {
    const { result } = renderHook(() => useMusicPanel());

    act(() => {
      setMusicPanel('devices');
      setMusicPanel(null);
    });

    expect(result.current).toBeNull();
  });
});
