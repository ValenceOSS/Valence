import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePageWarming } from './usePageWarming';

const asked: string[] = [];

class FakeImage {
  decoding = '';

  onload: (() => void) | null = null;

  onerror: (() => void) | null = null;

  set src(address: string) {
    asked.push(address);
    queueMicrotask(() => {
      this.onload?.();
    });
  }
}

beforeEach(() => {
  asked.length = 0;
  vi.stubGlobal('Image', FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const urlFor = (page: number): string => `/page/${page.toString()}`;

describe('usePageWarming', () => {
  it('fetches the page somebody is on and the ones just after it first', async () => {
    renderHook(() => {
      usePageWarming(2, 10, urlFor);
    });

    await vi.waitFor(() => {
      expect(asked.length).toBe(10);
    });

    expect(asked.slice(0, 4)).toEqual(['/page/2', '/page/3', '/page/4', '/page/1']);
  });

  it('fetches every page of a short chapter, and each only once', async () => {
    const { rerender } = renderHook(
      ({ centre }) => {
        usePageWarming(centre, 6, urlFor);
      },
      { initialProps: { centre: 0 } },
    );

    await vi.waitFor(() => {
      expect(asked.length).toBe(6);
    });

    rerender({ centre: 3 });

    expect(asked).toHaveLength(6);
  });

  it('keeps to a window of a long chapter rather than all of it', async () => {
    renderHook(() => {
      usePageWarming(500, 1000, urlFor);
    });

    await vi.waitFor(() => {
      expect(asked.length).toBe(120);
    });

    expect(asked).not.toContain('/page/999');
  });
});
