import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Answer } from '@ValenceClient/admin/sendToServer';
import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';
import { aMediaImportRun } from './aMediaImportRun';
import { useImportRun } from './useImportRun';

const fetchImportRun = vi.fn<(runId: string) => Promise<Answer<MediaImportRun>>>();

vi.mock('@ValenceClient/imports/fetchImportRun', () => ({
  fetchImportRun: (runId: string) => fetchImportRun(runId),
}));

beforeEach(() => {
  vi.useFakeTimers();
  fetchImportRun.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useImportRun', () => {
  it('reads an import again every second until it settles', async () => {
    fetchImportRun
      .mockResolvedValueOnce({ kind: 'answered', value: aMediaImportRun({ state: 'planning' }) })
      .mockResolvedValueOnce({ kind: 'refused', refusal: null })
      .mockResolvedValue({ kind: 'answered', value: aMediaImportRun({ state: 'planned' }) });

    const started = aMediaImportRun();
    const { result } = renderHook(() => useImportRun(started));

    for (let second = 0; second < 3; second += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    expect(result.current?.state).toBe('planned');
    expect(fetchImportRun).toHaveBeenCalledTimes(3);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(fetchImportRun).toHaveBeenCalledTimes(3);
  });

  it('follows nothing where there is no import', () => {
    const { result } = renderHook(() => useImportRun(null));

    expect(result.current).toBeNull();
  });
});
