import { describe, expect, it } from 'vitest';
import { blockHasLapsed } from './blockHasLapsed';

const NOW = new Date('2026-11-09T12:00:00.000Z');

const blockOf = (code: string, at: string) => ({ reason: { code, values: {}, message: '' }, at });

describe('blockHasLapsed', () => {
  it('lets a release that nobody was sharing be tried again half a day later', () => {
    expect(
      blockHasLapsed(
        blockOf(
          'requests.downloads.judgeDownload.itNeverGotItsFileList',
          '2026-11-08T23:00:00.000Z',
        ),
        NOW,
      ),
    ).toBe(true);
    expect(
      blockHasLapsed(
        blockOf(
          'requests.downloads.judgeDownload.itNeverGotItsFileList',
          '2026-11-09T06:00:00.000Z',
        ),
        NOW,
      ),
    ).toBe(false);
  });

  it('keeps giving up on a release that failed for what it is', () => {
    expect(
      blockHasLapsed(
        blockOf(
          'requests.downloads.downloadQueue.itHoldsNothingValenceCanFile',
          '2026-10-01T00:00:00.000Z',
        ),
        NOW,
      ),
    ).toBe(false);
  });
});
