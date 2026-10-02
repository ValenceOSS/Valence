import { afterEach, describe, expect, it, vi } from 'vitest';
import { planArrImport } from './planArrImport';

const A_PLAN = {
  sources: [],
  clients: [],
  indexers: [],
  prowlarr: null,
  profiles: [],
  libraries: [],
  unplacedFolders: [],
  wanted: { films: 0, series: 0, artists: 0, requests: 0, unaskable: 0 },
  secrets: [],
};

const ASK = { sources: [{ kind: 'sonarr' as const, url: 'http://sonarr:8989', apiKey: 'key' }] };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('planArrImport', () => {
  it('asks for a plan of the apps given', async () => {
    const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
      Promise.resolve(Response.json(A_PLAN)),
    );

    vi.stubGlobal('fetch', fetchMock);

    expect(await planArrImport(ASK)).toEqual({ value: A_PLAN, refusal: null });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/imports/arr/plan');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(ASK));
  });

  it('says why a plan was refused', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ error: 'Requesting is off.' }, { status: 404 }))),
    );

    expect(await planArrImport(ASK)).toEqual({
      value: null,
      refusal: { message: 'Requesting is off.' },
    });
  });
});
