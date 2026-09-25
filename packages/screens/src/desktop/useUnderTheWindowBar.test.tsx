import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUnderTheWindowBar } from './useUnderTheWindowBar';

describe('useUnderTheWindowBar', () => {
  it('says the page stands under the window bar while it is showing, and stops once it has gone', () => {
    const shown = renderHook(() => {
      useUnderTheWindowBar();
    });

    expect(document.documentElement.dataset['valenceWayIn']).toBe('true');

    shown.unmount();

    expect(document.documentElement.dataset['valenceWayIn']).toBeUndefined();
  });
});
