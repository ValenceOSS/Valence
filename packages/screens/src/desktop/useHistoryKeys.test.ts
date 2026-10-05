import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useHistoryKeys } from './useHistoryKeys';

const waysWith = (canGoBack: boolean, canGoForward: boolean) => ({
  canGoBack,
  canGoForward,
  back: vi.fn(),
  forward: vi.fn(),
});

describe('useHistoryKeys', () => {
  it('goes back and forward with command and a bracket on a Mac', () => {
    const ways = waysWith(true, true);

    renderHook(() => {
      useHistoryKeys(ways, 'darwin');
    });
    fireEvent.keyDown(window, { key: '[', metaKey: true });
    fireEvent.keyDown(window, { key: ']', metaKey: true });

    expect(ways.back).toHaveBeenCalledOnce();
    expect(ways.forward).toHaveBeenCalledOnce();
  });

  it('goes back with alt and an arrow on Windows, and not with a bare arrow', () => {
    const ways = waysWith(true, false);

    renderHook(() => {
      useHistoryKeys(ways, 'win32');
    });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowLeft', altKey: true });
    fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true });

    expect(ways.back).toHaveBeenCalledOnce();
    expect(ways.forward).not.toHaveBeenCalled();
  });
});
