import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useWindowBarOnTheFrame } from './useWindowBarOnTheFrame';

describe('useWindowBarOnTheFrame', () => {
  it('says the window bar takes the frame’s colour while the page is showing, and stops once it has gone', () => {
    const shown = renderHook(() => {
      useWindowBarOnTheFrame();
    });

    expect(document.documentElement.dataset['valenceOnTheFrame']).toBe('true');

    shown.unmount();

    expect(document.documentElement.dataset['valenceOnTheFrame']).toBeUndefined();
  });
});
