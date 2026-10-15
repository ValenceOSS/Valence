import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchChapters } from './fetchChapters';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const respondWith = (answer: { ok: boolean; body: JsonValue }) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: answer.ok,
        status: answer.ok ? 200 : 404,
        json: () => Promise.resolve(answer.body),
      }),
    ),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchChapters', () => {
  it('reads the chapters the file marks', async () => {
    const chapters = [{ title: 'Opening', startSeconds: 0, endSeconds: 90 }];

    respondWith({ ok: true, body: { chapters } });

    await expect(fetchChapters('media-1')).resolves.toEqual(chapters);
  });

  it('says so when the server refuses', async () => {
    respondWith({ ok: false, body: null });

    await expect(fetchChapters('media-1')).rejects.toThrow();
  });
});
