import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addBucket, changeBucket, fetchBuckets, removeBucket, testBucket } from './fetchBuckets';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { BucketChange } from '@ValenceContracts/schemas/Bucket';

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<JsonValue>;
  clone: () => { ok: boolean; status: number; json: () => Promise<JsonValue> };
}>;

const fetchMock = vi.fn<FetchLike>();

const answer = (body: JsonValue, ok = true, status = 200) => {
  const made = { ok, status, json: () => Promise.resolve(body) };

  return { ...made, clone: () => made };
};

const CHANGE: BucketChange = {
  name: 'Films',
  provider: 'AWS',
  endpoint: '',
  region: '',
  bucket: 'media',
  prefix: '',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchBuckets', () => {
  it('reads the buckets and whether this server can mount them', async () => {
    fetchMock.mockResolvedValue(answer({ canMount: false, buckets: [] }));

    await expect(fetchBuckets()).resolves.toEqual({ canMount: false, buckets: [] });
  });
});

describe('changing buckets', () => {
  it('adds, changes and removes one, each at its own address', async () => {
    fetchMock.mockResolvedValue(answer({ canMount: true, buckets: [] }));

    await expect(addBucket(CHANGE)).resolves.toBeNull();
    await changeBucket('films', CHANGE);
    await removeBucket('films');

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      ['/api/admin/buckets', 'POST'],
      ['/api/admin/buckets/films', 'PUT'],
      ['/api/admin/buckets/films', 'DELETE'],
    ]);
  });

  it('says what the server refused with', async () => {
    fetchMock.mockResolvedValue(
      answer({ error: 'A library still reads from that bucket.' }, false, 409),
    );

    await expect(removeBucket('films')).resolves.toEqual({
      message: 'A library still reads from that bucket.',
    });
  });
});

describe('testBucket', () => {
  it('answers with the folders the server reached', async () => {
    fetchMock.mockResolvedValue(answer({ kind: 'reached', folders: ['Films'] }));

    await expect(testBucket(CHANGE, 'films')).resolves.toEqual({
      kind: 'reached',
      folders: ['Films'],
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/buckets/test?id=films');
  });

  it('answers with a refusal where the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(testBucket(CHANGE, null)).resolves.toMatchObject({ kind: 'refused' });
  });
});
