import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cancelReencode,
  confirmReencode,
  fetchReencodeEstimate,
  fetchReencodes,
  fetchRenditions,
  rejectReencode,
  removeRendition,
  sampleReencode,
  startReencodes,
} from './fetchReencodes';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

const MEDIA_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const REENCODE_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3302';

const replacing: ReencodeSettings = {
  mode: 'replace',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
};

const aReencode = {
  id: REENCODE_ID,
  mediaId: MEDIA_ID,
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3303',
  title: 'Azkaban',
  seriesTitle: null,
  mode: 'replace',
  state: 'awaitingReview',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
  durationSeconds: 8520,
  originalSizeBytes: 70_000_000_000,
  estimatedBytes: 6_000_000_000,
  producedBytes: 5_600_000_000,
  progress: 1,
  bytesPerSecond: null,
  failure: null,
  askedAt: '2026-09-18T22:00:00.000Z',
  startedAt: null,
  encodedAt: null,
  reviewedAt: null,
};

const answering = (body: object, status = 200) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchReencodeEstimate', () => {
  it('reads what is held now and what would be held after', async () => {
    vi.stubGlobal(
      'fetch',
      answering({
        candidates: [],
        nowBytes: 70_000_000_000,
        afterBytes: 6_000_000_000,
        freeBytes: 900_000_000_000,
        committedBytes: 0,
        awaitingReview: 0,
        awaitingReviewCap: 5,
      }),
    );

    const estimate = await fetchReencodeEstimate([MEDIA_ID], replacing);

    expect(estimate?.afterBytes).toBe(6_000_000_000);
  });

  it('answers with nothing rather than throwing when the server refuses', async () => {
    vi.stubGlobal('fetch', answering({ error: 'no' }, 403));

    expect(await fetchReencodeEstimate([MEDIA_ID], replacing)).toBeNull();
  });

  it('answers with nothing when the request could not be made at all', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    expect(await fetchReencodeEstimate([MEDIA_ID], replacing)).toBeNull();
  });
});

describe('startReencodes', () => {
  it('answers with what was taken on and what was turned away', async () => {
    vi.stubGlobal(
      'fetch',
      answering(
        {
          started: [aReencode],
          refused: [
            { mediaId: MEDIA_ID, refusal: { code: 'BeingWatched', detail: 'Somebody is.' } },
          ],
        },
        202,
      ),
    );

    const started = await startReencodes([MEDIA_ID], replacing);

    expect(started?.started).toHaveLength(1);
    expect(started?.refused[0]?.refusal.code).toBe('BeingWatched');
  });
});

describe('fetchReencodes', () => {
  it('reads every re-encode', async () => {
    vi.stubGlobal('fetch', answering({ reencodes: [aReencode] }));

    expect(await fetchReencodes()).toHaveLength(1);
  });
});

describe('fetchRenditions', () => {
  it('reads what is kept beside an item', async () => {
    vi.stubGlobal('fetch', answering({ renditions: [] }));

    expect(await fetchRenditions(MEDIA_ID)).toEqual([]);
  });
});

describe('judging a finished encode', () => {
  it('says yes when the original has been disposed of', async () => {
    vi.stubGlobal('fetch', answering({ done: true }));

    expect(await confirmReencode(REENCODE_ID)).toBe(true);
  });

  it('says yes when the original has been put back', async () => {
    vi.stubGlobal('fetch', answering({ done: true }));

    expect(await rejectReencode(REENCODE_ID)).toBe(true);
  });

  it('says no for a re-encode that is not there', async () => {
    vi.stubGlobal('fetch', answering({ error: 'no' }, 404));

    expect(await confirmReencode(REENCODE_ID)).toBe(false);
  });
});

describe('the rest of the queue', () => {
  it('stops one that has not finished', async () => {
    vi.stubGlobal('fetch', answering({ done: true }));

    expect(await cancelReencode(REENCODE_ID)).toBe(true);
  });

  it('asks for a sample', async () => {
    vi.stubGlobal('fetch', answering({ done: true }, 202));

    expect(await sampleReencode(REENCODE_ID)).toBe(true);
  });

  it('removes a rendition somebody did not like', async () => {
    vi.stubGlobal('fetch', answering({ done: true }));

    expect(await removeRendition(REENCODE_ID)).toBe(true);
  });
});
