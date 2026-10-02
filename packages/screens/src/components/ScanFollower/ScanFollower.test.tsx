import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScanFollower } from './ScanFollower';

type Scan = {
  jobId: string;
  state: 'queued' | 'running' | 'completed' | 'failed' | 'unknown';
  phase: { code: string | null; message: string; values: Record<string, string> } | null;
  processed: number | null;
  total: number | null;
  item: string | null;
};

const readScanState = vi.fn<(jobId: string) => Promise<Scan>>();

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  readScanState: (jobId: string) => readScanState(jobId),
}));

beforeEach(() => {
  vi.useFakeTimers();
  readScanState.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Lets a second pass, and what it started settle.
 */
const aSecondPasses = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
};

describe('ScanFollower', () => {
  it('follows a scan live until it finishes, then says so once', async () => {
    const onSettled = vi.fn();

    readScanState
      .mockResolvedValueOnce({
        jobId: 'j',
        state: 'running',
        phase: { code: null, message: 'Reading files', values: {} },
        processed: 5,
        total: 10,
        item: null,
      })
      .mockResolvedValue({
        jobId: 'j',
        state: 'completed',
        phase: null,
        processed: 10,
        total: 10,
        item: null,
      });

    render(<ScanFollower jobId="j" name="Films" onSettled={onSettled} />);

    expect(screen.getByText('Waiting its turn')).toBeVisible();

    await aSecondPasses();

    expect(screen.getByText('Reading files')).toBeVisible();

    await aSecondPasses();
    await aSecondPasses();

    expect(screen.getByText('Scanned')).toBeVisible();
    expect(screen.getByLabelText('Scanning Films')).toBeInTheDocument();
    expect(onSettled).toHaveBeenCalledWith('j');
    expect(readScanState).toHaveBeenCalledTimes(2);
  });

  it('says when a scan failed', async () => {
    readScanState.mockResolvedValue({
      jobId: 'j',
      state: 'failed',
      phase: null,
      processed: null,
      total: null,
      item: null,
    });
    render(<ScanFollower jobId="j" name="Films" onSettled={vi.fn()} />);

    await aSecondPasses();

    expect(screen.getByText('The scan failed')).toBeVisible();
  });
});
