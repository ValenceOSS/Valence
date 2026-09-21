import { describe, expect, it } from 'vitest';
import { downloadFacts } from '@ValenceRequests/mediaRequests/downloadFacts';

const SENT = '2026-09-21T00:00:00.000Z';

describe('downloadFacts', () => {
  it('says how large the download was and how long it took', () => {
    expect(
      downloadFacts({
        sizeBytes: 2_000_000_000,
        doneBytes: 2_000_000_000,
        sentAt: SENT,
        finishedAt: '2026-09-21T00:20:00.000Z',
      }),
    ).toEqual({ downloadedBytes: 2_000_000_000, downloadSeconds: 1200 });
  });

  it('counts the wait from when it was sent, queueing and all', () => {
    expect(
      downloadFacts({
        sizeBytes: null,
        doneBytes: 1,
        sentAt: SENT,
        finishedAt: '2026-09-21T02:00:00.000Z',
      }).downloadSeconds,
    ).toBe(7200);
  });

  it('takes what the client says arrived over what the release claimed', () => {
    expect(
      downloadFacts({
        sizeBytes: 9_000_000_000,
        doneBytes: 2_000_000_000,
        sentAt: SENT,
        finishedAt: null,
      }).downloadedBytes,
    ).toBe(2_000_000_000);
  });

  it('falls back to what the release claimed where the client said nothing', () => {
    expect(
      downloadFacts({
        sizeBytes: 9_000_000_000,
        doneBytes: null,
        sentAt: SENT,
        finishedAt: null,
      }).downloadedBytes,
    ).toBe(9_000_000_000);
  });

  it('says nothing about how long where the download never finished', () => {
    expect(
      downloadFacts({ sizeBytes: 1, doneBytes: 1, sentAt: SENT, finishedAt: null }).downloadSeconds,
    ).toBeNull();
  });

  it('says nothing rather than a negative wait where the clocks disagree', () => {
    expect(
      downloadFacts({
        sizeBytes: 1,
        doneBytes: 1,
        sentAt: SENT,
        finishedAt: '2026-09-20T23:00:00.000Z',
      }).downloadSeconds,
    ).toBeNull();
  });

  it('says nothing about how long where a moment will not parse', () => {
    expect(
      downloadFacts({ sizeBytes: 1, doneBytes: 1, sentAt: 'never', finishedAt: SENT })
        .downloadSeconds,
    ).toBeNull();
  });
});
