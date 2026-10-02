import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchImportPeople } from './fetchImportPeople';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ANSWER = {
  people: [{ id: 'u', name: 'U', isAdministrator: false, isDisabled: false, access: 'needsPin' }],
};

describe('fetchImportPeople', () => {
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

    expect(await fetchImportPeople('source')).toEqual({ kind: 'answered', value: ANSWER });

    const [path, init] = fetchMock.mock.calls[0] ?? ['', { method: '' }];

    expect(path).toBe('/api/admin/imports/source/people');
    expect(init).toMatchObject({ method: 'GET', credentials: 'same-origin' });
  });

  it('passes on the server’s refusal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'No.' }) }),
    );

    expect(await fetchImportPeople('source')).toEqual({
      kind: 'refused',
      refusal: { message: 'No.' },
    });
  });
});
