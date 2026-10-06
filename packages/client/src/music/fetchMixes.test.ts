import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { fetchMix, fetchMixes } from './fetchMixes';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const answerWith = (body: JsonValue) => {
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) });
};

const SUMMARY = {
  id: 'genre-hip-hop',
  kind: 'genre',
  title: 'Hip-Hop Mix',
  detail: 'The best of Hip-Hop',
  trackCount: 1,
  coverAlbumIds: [],
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchMixes', () => {
  it('reads the mixes made for this profile today', async () => {
    answerWith({ mixes: [SUMMARY] });

    await expect(fetchMixes()).resolves.toEqual([SUMMARY]);
    expect(fetchMock).toHaveBeenCalledWith('/api/music/mixes', expect.anything());
  });

  it('reads one mix with its songs, its id kept safe in the address', async () => {
    answerWith({ ...SUMMARY, tracks: [aTrack(1)] });

    await expect(fetchMix('genre-hip/hop')).resolves.toMatchObject({ tracks: [aTrack(1)] });
    expect(fetchMock).toHaveBeenCalledWith('/api/music/mixes/genre-hip%2Fhop', expect.anything());
  });
});
