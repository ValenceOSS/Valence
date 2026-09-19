import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';
import { useWeighing } from './useWeighing';

const settings: ReencodeSettings = {
  mode: 'replace',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
};

const rest = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 400);
  });

describe('useWeighing', () => {
  it('asks once the choosing has stopped', async () => {
    const onWeigh = vi.fn();

    renderHook(() => {
      useWeighing(true, ['a'], settings, onWeigh);
    });

    await waitFor(() => {
      expect(onWeigh).toHaveBeenCalledWith(['a'], settings);
    });
  });

  it('asks nothing while nothing is being chosen', async () => {
    const onWeigh = vi.fn();

    renderHook(() => {
      useWeighing(false, ['a'], settings, onWeigh);
    });

    await rest();

    expect(onWeigh).not.toHaveBeenCalled();
  });

  it('does not ask again merely because the caller handed back a new function', async () => {
    const onWeigh = vi.fn();
    const ids = ['a'];

    const { rerender } = renderHook(
      ({ ask }: { ask: (mediaIds: string[], chosen: ReencodeSettings) => void }) => {
        useWeighing(true, ids, settings, ask);
      },
      {
        initialProps: {
          ask: (mediaIds: string[], chosen: ReencodeSettings) => {
            onWeigh(mediaIds, chosen);
          },
        },
      },
    );

    await waitFor(() => {
      expect(onWeigh).toHaveBeenCalled();
    });

    rerender({
      ask: (mediaIds, chosen) => {
        onWeigh(mediaIds, chosen);
      },
    });

    await rest();

    expect(onWeigh).toHaveBeenCalledTimes(1);
  });

  it('asks once for a burst of choosing rather than once per change', async () => {
    const onWeigh = vi.fn();

    const { rerender } = renderHook(
      ({ ids }: { ids: string[] }) => {
        useWeighing(true, ids, settings, onWeigh);
      },
      { initialProps: { ids: ['a'] } },
    );

    rerender({ ids: ['a', 'b'] });
    rerender({ ids: ['a', 'b', 'c'] });

    await waitFor(() => {
      expect(onWeigh).toHaveBeenCalledWith(['a', 'b', 'c'], settings);
    });

    expect(onWeigh).toHaveBeenCalledTimes(1);
  });
})
