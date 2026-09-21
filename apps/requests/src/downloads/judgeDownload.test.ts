import { describe, expect, it } from 'vitest';
import { judgeDownload } from '@ValenceRequests/downloads/judgeDownload';
import type { DownloadRules } from '@ValenceRequests/downloads/judgeDownload';
import type { SentDownloadRecord } from '@ValenceRequests/downloads/SentDownloadRecord';

const MINUTE = 60 * 1000;

const HOUR = 60 * MINUTE;

const SENT = '2026-09-21T00:00:00.000Z';

const RULES: DownloadRules = {
  metadataForMs: 5 * MINUTE,
  stalledForMs: 6 * HOUR,
  settlesForMs: 15 * MINUTE,
  wouldTakeLongerThanMs: 24 * HOUR,
};

const at = (ms: number) => new Date(Date.parse(SENT) + ms);

const aDownload = (
  overrides: Partial<
    Pick<
      SentDownloadRecord,
      'protocol' | 'state' | 'problem' | 'sizeBytes' | 'doneBytes' | 'sentAt' | 'updatedAt'
    >
  > = {},
) => ({
  protocol: 'torrent' as const,
  state: 'downloading' as const,
  problem: null,
  sizeBytes: 1_000_000_000,
  doneBytes: 0,
  sentAt: SENT,
  updatedAt: SENT,
  ...overrides,
});

describe('judgeDownload', () => {
  it('leaves a download that is coming along alone', () => {
    expect(judgeDownload(aDownload({ doneBytes: 500_000_000 }), at(30 * MINUTE), RULES)).toEqual({
      isDoomed: false,
      reason: null,
    });
  });

  it('gives up on one the client says has failed, saying why', () => {
    expect(
      judgeDownload(
        aDownload({ state: 'failed', problem: 'The tracker is gone' }),
        at(MINUTE),
        RULES,
      ),
    ).toEqual({ isDoomed: true, reason: 'The tracker is gone' });
  });

  it('gives up on a torrent that never learned what it holds', () => {
    const stuck = aDownload({ sizeBytes: null, doneBytes: null });

    expect(judgeDownload(stuck, at(4 * MINUTE), RULES).isDoomed).toBe(false);
    expect(judgeDownload(stuck, at(6 * MINUTE), RULES)).toEqual({
      isDoomed: true,
      reason: 'It never got its file list, so it never started',
    });
  });

  it('does not ask that of usenet, which has no such step', () => {
    expect(
      judgeDownload(
        aDownload({ protocol: 'usenet', sizeBytes: null, doneBytes: null }),
        at(HOUR),
        RULES,
      ).isDoomed,
    ).toBe(false);
  });

  it('gives up on one that has stalled for long enough to mean it', () => {
    const stalled = aDownload({ state: 'stalled', doneBytes: 1_000_000 });

    expect(judgeDownload(stalled, at(HOUR), RULES).isDoomed).toBe(false);
    expect(judgeDownload(stalled, at(7 * HOUR), RULES)).toEqual({
      isDoomed: true,
      reason: 'It stalled, with nobody to fetch it from',
    });
  });

  it('gives up on one so slow it would still be going long after anybody cared', () => {
    const crawling = aDownload({ doneBytes: 1_000_000 });
    const judged = judgeDownload(crawling, at(HOUR), RULES);

    expect(judged.isDoomed).toBe(true);
    expect(judged.reason).toBe('At the rate it is going it would take another 42 days');
  });

  it('spares one that has nearly arrived, however slowly it is going now', () => {
    expect(
      judgeDownload(aDownload({ doneBytes: 999_000_000 }), at(10 * HOUR), RULES).isDoomed,
    ).toBe(false);
  });

  it('judges nothing on speed before it has had time to settle', () => {
    expect(judgeDownload(aDownload({ doneBytes: 1000 }), at(5 * MINUTE), RULES).isDoomed).toBe(
      false,
    );
  });

  it('leaves alone what is finished or deliberately paused', () => {
    expect(judgeDownload(aDownload({ state: 'done' }), at(100 * HOUR), RULES).isDoomed).toBe(false);
    expect(judgeDownload(aDownload({ state: 'paused' }), at(100 * HOUR), RULES).isDoomed).toBe(
      false,
    );
  });

  it('says hours rather than days for something merely too slow', () => {
    expect(
      judgeDownload(aDownload({ doneBytes: 900_000_000 }), at(10 * HOUR), {
        ...RULES,
        wouldTakeLongerThanMs: HOUR,
      }).reason,
    ).toBe('At the rate it is going it would take another 1 hour');
  });
});
