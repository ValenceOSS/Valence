import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { fetchAnnouncement } from './fetchAnnouncement';

type Answer = { ok: boolean; headers: Headers; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const answerWith = (body: JsonValue) => {
  fetchMock.mockResolvedValue({
    ok: true,
    headers: new Headers(),
    json: () => Promise.resolve(body),
  });
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAnnouncement', () => {
  it('reads the announcement up for everybody', async () => {
    const announcement = {
      id: 'a',
      text: 'Back at six',
      severity: 'info',
      endsAt: null,
      postedAt: '2026-10-15T09:00:00.000Z',
    };

    answerWith({ announcement });

    await expect(fetchAnnouncement()).resolves.toEqual(announcement);
    expect(fetchMock).toHaveBeenCalledWith('/api/announcement', expect.anything());
  });

  it('answers with nothing where none is up', async () => {
    answerWith({ announcement: null });

    await expect(fetchAnnouncement()).resolves.toBeNull();
  });
});
