import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { fetchWayIn } from './fetchWayIn';

type Answer = { ok: boolean; headers: Headers; json: () => Promise<JsonValue> };

type FetchLike = (input: string, init?: RequestInit) => Promise<Answer>;

const fetchMock = vi.fn<FetchLike>();

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const answerWith = (body: JsonValue, ok = true) => {
  fetchMock.mockResolvedValue({ ok, headers: new Headers(), json: () => Promise.resolve(body) });
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchWayIn', () => {
  it('asks the same address as the faces, so the picture is shown exactly where they are', async () => {
    answerWith({ profiles: [], splashscreen: null });

    await fetchWayIn();

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles/everyone', expect.anything());
  });

  it('answers with the faces and where the picture is read from', async () => {
    answerWith({ profiles: [PROFILE], splashscreen: '/api/splashscreen?v=a.jpg' });

    await expect(fetchWayIn()).resolves.toEqual({
      profiles: [PROFILE],
      splashscreen: '/api/splashscreen?v=a.jpg',
    });
  });

  it('has no picture from a server too old to name one', async () => {
    answerWith({ profiles: [PROFILE] });

    await expect(fetchWayIn()).resolves.toEqual({ profiles: [PROFILE], splashscreen: null });
  });

  it('says so when the server keeps who lives here to itself', async () => {
    answerWith({ error: 'Nobody is signed in.' }, false);

    await expect(fetchWayIn()).rejects.toThrow();
  });
});
