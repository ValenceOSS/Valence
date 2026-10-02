import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveImportMappings } from './saveImportMappings';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ANSWER = { mappings: [{ from: '/data', to: '/media' }], libraries: [] };

describe('saveImportMappings', () => {
  it('asks the server and reads its answer', async () => {
    const fetchMock = vi
      .fn<
        (
          path: string,
          init: { method: string; body?: string },
        ) => Promise<{ ok: boolean; json: () => Promise<object> }>
      >()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(ANSWER) });

    vi.stubGlobal('fetch', fetchMock);

    expect(await saveImportMappings('source', [{ from: '/data', to: '/media' }])).toEqual({
      kind: 'answered',
      value: ANSWER,
    });

    const [path, init] = fetchMock.mock.calls[0] ?? ['', { method: '' }];

    expect(path).toBe('/api/admin/imports/source/mappings');
    expect(init).toMatchObject({ method: 'PUT', credentials: 'same-origin' });
    expect(JSON.parse(init.body ?? '')).toEqual({ mappings: [{ from: '/data', to: '/media' }] });
  });

  it('passes on the server’s refusal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'No.' }) }),
    );

    expect(await saveImportMappings('source', [{ from: '/data', to: '/media' }])).toEqual({
      kind: 'refused',
      refusal: { message: 'No.' },
    });
  });
});
