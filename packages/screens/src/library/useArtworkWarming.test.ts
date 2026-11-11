import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useArtworkWarming } from './useArtworkWarming';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useArtworkWarming', () => {
  it('asks for every picture given, skipping the ones it does not have', () => {
    const asked: string[] = [];

    vi.stubGlobal(
      'Image',
      class {
        decoding = '';

        set src(url: string) {
          asked.push(url);
        }

        async decode() {
          return Promise.resolve();
        }
      },
    );

    renderHook(() => {
      useArtworkWarming(['/one.webp', undefined, '/two.webp']);
    });

    expect(asked).toEqual(['/one.webp', '/two.webp']);
  });
});
