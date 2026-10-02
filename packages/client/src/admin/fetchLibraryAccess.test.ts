import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearException,
  fetchExceptionsOn,
  fetchLibraryAccess,
  setCeiling,
  setException,
  setLibraryAccess,
} from './fetchLibraryAccess';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

const LIBRARY = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Films',
  mayView: true,
  maximumAge: 12,
  allowsUnrated: false,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reading who may see what', () => {
  it('reads the libraries an account may see, and their ceilings', async () => {
    fetchMock.mockResolvedValue(Response.json({ libraries: [LIBRARY] }));

    await expect(fetchLibraryAccess('usr-1')).resolves.toEqual([LIBRARY]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/accounts/usr-1/libraries');
  });

  it('reads who has an exception to one programme', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ accounts: [{ accountId: 'usr-1', effect: 'deny' }] }),
    );

    await expect(fetchExceptionsOn({ kind: 'series', subjectId: 'show' })).resolves.toEqual([
      { accountId: 'usr-1', effect: 'deny' },
    ]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/exceptions/series/show');
  });

  it('throws where the server refuses to say', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'No.' }, { status: 403 }));

    await expect(fetchLibraryAccess('usr-1')).rejects.toThrow();
  });
});

describe('changing who may see what', () => {
  const changes: [string, () => Promise<{ message: string } | null>, string, string, string?][] = [
    [
      'letting an account into a library',
      () => setLibraryAccess('usr-1', 'lib', true),
      '/api/admin/accounts/usr-1/libraries/lib',
      'PUT',
    ],
    [
      'keeping an account out of a library',
      () => setLibraryAccess('usr-1', 'lib', false),
      '/api/admin/accounts/usr-1/libraries/lib',
      'DELETE',
    ],
    [
      'setting a ceiling',
      () => setCeiling('usr-1', 'lib', { maximumAge: 12, allowsUnrated: true }),
      '/api/admin/accounts/usr-1/libraries/lib/ceiling',
      'PUT',
      JSON.stringify({ maximumAge: 12, allowsUnrated: true }),
    ],
    [
      'lifting a ceiling',
      () => setCeiling('usr-1', 'lib', null),
      '/api/admin/accounts/usr-1/libraries/lib/ceiling',
      'DELETE',
    ],
    [
      'making an exception',
      () => setException('usr-1', { kind: 'item', subjectId: 'film' }, 'allow'),
      '/api/admin/accounts/usr-1/exceptions',
      'PUT',
      JSON.stringify({ kind: 'item', subjectId: 'film', effect: 'allow' }),
    ],
    [
      'clearing an exception',
      () => clearException('usr-1', { kind: 'series', subjectId: 'show' }),
      '/api/admin/accounts/usr-1/exceptions/series/show',
      'DELETE',
    ],
  ];

  for (const [what, run, path, method, body] of changes) {
    describe(what, () => {
      it('says nothing when the server agreed', async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

        await expect(run()).resolves.toBeNull();
        expect(fetchMock.mock.calls[0]?.[0]).toBe(path);
        expect(fetchMock.mock.calls[0]?.[1]?.method).toBe(method);
        expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(body);
      });

      it('passes on why the server refused', async () => {
        fetchMock.mockResolvedValue(Response.json({ error: 'No.' }, { status: 400 }));

        await expect(run()).resolves.toEqual({ message: 'No.' });
      });

      it('says the server could not be reached', async () => {
        fetchMock.mockRejectedValue(new Error('offline'));

        await expect(run()).resolves.toEqual({ message: 'The server could not be reached.' });
      });
    });
  }
});
