import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyArrImport } from './applyArrImport';

const APPLIED = {
  clients: { added: 1, kept: 0 },
  indexers: { added: 0, kept: 0 },
  profiles: { added: 0, kept: 0 },
  apps: { added: 0, kept: 0 },
  prowlarr: null,
  libraries: [],
  wanted: [],
  problems: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('applyArrImport', () => {
  it('brings in the apps given, with the choices made', async () => {
    const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
      Promise.resolve(Response.json(APPLIED)),
    );
    const ask = {
      sources: [{ kind: 'radarr' as const, url: 'http://radarr:7878', apiKey: 'key' }],
      choices: { films: 'takeOver' as const },
    };

    vi.stubGlobal('fetch', fetchMock);

    expect((await applyArrImport(ask)).value).toEqual(APPLIED);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/imports/arr/apply');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
  });
});
