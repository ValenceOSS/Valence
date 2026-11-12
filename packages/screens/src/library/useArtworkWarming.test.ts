import { act, renderHook } from '@testing-library/react';
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

  it('keeps to six at once however often the list changes while they are on their way', async () => {
    const asked: string[] = [];
    const settles: (() => void)[] = [];

    vi.stubGlobal(
      'Image',
      class {
        decoding = '';

        set src(url: string) {
          asked.push(url);
        }

        async decode() {
          return new Promise<void>((resolve) => {
            settles.push(resolve);
          });
        }
      },
    );

    const first = Array.from({ length: 8 }, (_, at) => `/first-${at.toString()}.webp`);
    const second = Array.from({ length: 8 }, (_, at) => `/second-${at.toString()}.webp`);
    const { rerender } = renderHook(
      ({ urls }: { urls: readonly string[] }) => {
        useArtworkWarming(urls);
      },
      { initialProps: { urls: first } },
    );

    rerender({ urls: second });

    expect(asked).toHaveLength(6);

    await act(async () => {
      settles.shift()?.();
      await new Promise((settled) => {
        setTimeout(settled, 0);
      });
    });

    expect(asked).toHaveLength(7);
    expect(asked.at(-1)).toBe('/second-0.webp');

    await act(async () => {
      while (settles.length > 0) {
        settles.shift()?.();
        await new Promise((settled) => {
          setTimeout(settled, 0);
        });
      }
    });
  });
});
