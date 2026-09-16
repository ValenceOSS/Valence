import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchHidden, setHidden } from './fetchHidden';
import { writeCurrentProfile } from '@ValenceClient/profiles/currentProfile';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; status: number; json: () => Promise<JsonValue> }>;

const fetchMock = vi.fn<FetchLike>();

const ok = (body: JsonValue) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

const ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

beforeEach(() => {
  installPlatform(aFakePlatform());
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('reading what somebody has hidden', () => {
  it('answers with the entries, newest first as the server ordered them', async () => {
    fetchMock.mockResolvedValue(
      ok({
        hidden: [
          { kind: 'library', subjectId: ID, title: 'Shows', hiddenAt: '2026-09-16T00:00:00.000Z' },
        ],
      }),
    );

    await expect(fetchHidden()).resolves.toEqual([
      { kind: 'library', subjectId: ID, title: 'Shows', hiddenAt: '2026-09-16T00:00:00.000Z' },
    ]);
  });

  it('says which face is asking, since this is one person’s list', async () => {
    writeCurrentProfile('kid');
    fetchMock.mockResolvedValue(ok({ hidden: [] }));

    await fetchHidden();

    expect(fetchMock.mock.calls.at(-1)?.[1]?.headers).toMatchObject({
      'x-valence-profile': 'kid',
    });
  });

  it('says so when the server refuses, rather than answering with nothing', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve(null) });

    await expect(fetchHidden()).rejects.toThrow();
  });

  it('says so when the answer is not the shape it was promised', async () => {
    fetchMock.mockResolvedValue(ok({ hidden: [{ kind: 'person', subjectId: ID }] }));

    await expect(fetchHidden()).rejects.toThrow();
  });
});

describe('hiding and bringing back', () => {
  it.each([
    ['item', `/api/media/${ID}/hidden`],
    ['series', `/api/series/${ID}/hidden`],
    ['library', `/api/libraries/${ID}/hidden`],
  ] as const)('puts a %s at the address that thing already has', async (kind, path) => {
    fetchMock.mockResolvedValue(ok(null));

    await setHidden({ kind, subjectId: ID }, true);

    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(path);
  });

  it('asks to hide with a put and to bring back with a delete', async () => {
    fetchMock.mockResolvedValue(ok(null));

    await setHidden({ kind: 'item', subjectId: ID }, true);
    expect(fetchMock.mock.calls.at(-1)?.[1]?.method).toBe('PUT');

    await setHidden({ kind: 'item', subjectId: ID }, false);
    expect(fetchMock.mock.calls.at(-1)?.[1]?.method).toBe('DELETE');
  });

  it('says which face is hiding it', async () => {
    writeCurrentProfile('kid');
    fetchMock.mockResolvedValue(ok(null));

    await setHidden({ kind: 'item', subjectId: ID }, true);

    expect(fetchMock.mock.calls.at(-1)?.[1]?.headers).toMatchObject({
      'x-valence-profile': 'kid',
    });
  });

  it('reports a refusal rather than throwing, so a control can put itself back', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve(null) });

    await expect(setHidden({ kind: 'item', subjectId: ID }, true)).resolves.toBe(false);
  });

  it('reports a server that cannot be reached the same way', async () => {
    fetchMock.mockRejectedValue(new Error('no network'));

    await expect(setHidden({ kind: 'item', subjectId: ID }, true)).resolves.toBe(false);
  });
});
