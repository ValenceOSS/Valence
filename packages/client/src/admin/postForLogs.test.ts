import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { postForLogs } from './postForLogs';

const fetchMock = vi.fn();

const Answer = z.object({ n: z.number() });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('postForLogs', () => {
  it('posts the question as JSON with the session and reads the answer', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ n: 3 }) });

    const answer = await postForLogs('/api/x', { a: 1 }, Answer, { n: 0 });

    expect(answer).toStrictEqual({ n: 3 });
    expect(fetchMock).toHaveBeenCalledWith('/api/x', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: '{"a":1}',
    });
  });

  it('falls back to nothing when the server refuses', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: () => Promise.resolve({ n: 3 }) });

    expect(await postForLogs('/api/x', {}, Answer, { n: 0 })).toStrictEqual({ n: 0 });
  });

  it('falls back to nothing when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    expect(await postForLogs('/api/x', {}, Answer, { n: 0 })).toStrictEqual({ n: 0 });
  });

  it('falls back to nothing when the answer is not what was promised', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ n: 'three' }) });

    expect(await postForLogs('/api/x', {}, Answer, { n: 0 })).toStrictEqual({ n: 0 });
  });

  it('falls back to nothing when the answer is not JSON', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.reject(new Error('no')) });

    expect(await postForLogs('/api/x', {}, Answer, { n: 0 })).toStrictEqual({ n: 0 });
  });
});
