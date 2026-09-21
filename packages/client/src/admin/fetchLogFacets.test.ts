import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLogFacets } from './fetchLogFacets';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchLogFacets', () => {
  it('asks for the most common sources and kinds of job', async () => {
    const facets = {
      sources: [{ value: 'jobs', events: 4 }],
      jobKinds: [{ value: 'library.scan', events: 2 }],
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(facets) });

    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchLogFacets({ levels: ['error'] })).toStrictEqual(facets);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/logs/facets');
  });

  it('lists nothing where the server refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }),
    );

    expect(await fetchLogFacets({})).toStrictEqual({ sources: [], jobKinds: [] });
  });
});
