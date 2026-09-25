import { describe, expect, it, vi } from 'vitest';
import { watchADownload } from './watchADownload';
import type { Download } from '@ValenceContracts/schemas/Download';

const PREPARING: Download = {
  id: '9c858901-8a57-4791-81fe-4c455b099bc9',
  mediaId: '9c858901-8a57-4791-81fe-4c455b099bd0',
  seriesId: null,
  seriesTitle: null,
  title: 'Arrival',
  quality: 'original',
  audioLanguages: [],
  state: 'preparing',
  progress: 0.4,
  bytesPerSecond: null,
  secondsLeft: null,
  sizeBytes: null,
  failure: null,
  askedFrom: null,
  askedAt: '2026-09-25T00:00:00.000Z',
  readyAt: null,
};

/**
 * Watches a download that reads as each of these in turn.
 *
 * @param seen - What each read finds.
 * @returns How it ended, and what was reported.
 */
const watching = (seen: (Download | null)[]) => {
  const find = vi.fn<() => Promise<Download | null>>();

  for (const one of seen) {
    find.mockResolvedValueOnce(one);
  }

  const report = vi.fn();
  const ended = watchADownload({ find, report, isCancelled: () => false, everyMs: 0 });

  return { ended, report };
};

describe('watchADownload', () => {
  it('reports how far along it is until it is ready', async () => {
    const { ended, report } = watching([
      PREPARING,
      { ...PREPARING, progress: 0.7 },
      { ...PREPARING, state: 'ready', progress: 1 },
    ]);

    await expect(ended).resolves.toBeUndefined();
    expect(report.mock.calls).toEqual([
      [40, 'Arrival'],
      [70, 'Arrival'],
      [100, null],
    ]);
  });

  it('fails the job with the reason the download failed', async () => {
    const { ended } = watching([
      { ...PREPARING, state: 'failed', failure: 'The media service could not prepare it.' },
    ]);

    await expect(ended).rejects.toThrow('The media service could not prepare it.');
  });

  it('fails the job when the download is thrown away part way through', async () => {
    const { ended } = watching([PREPARING, null]);

    await expect(ended).rejects.toThrow('thrown away');
  });

  it('ends without failing when somebody pauses it', async () => {
    const { ended } = watching([{ ...PREPARING, state: 'paused' }]);

    await expect(ended).resolves.toBeUndefined();
  });
});
