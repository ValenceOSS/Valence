import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  editTitleMetadata,
  fetchTitleHistory,
  fetchTitleMetadata,
  undoTitleChange,
} from './fetchTitleMetadata';

const METADATA = {
  subject: { kind: 'film', key: 'movie:603', libraryId: 'lib', isMatched: true },
  fields: { title: { value: 'A film', source: 'catalogue' } },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTitleMetadata', () => {
  it('reads a title’s fields and its history, for the scope asked', async () => {
    const fetched = vi.fn((address: string) =>
      Promise.resolve(
        new Response(JSON.stringify(address.includes('/history') ? { changes: [] } : METADATA)),
      ),
    );

    vi.stubGlobal('fetch', fetched);

    await expect(fetchTitleMetadata('a', 'season')).resolves.toMatchObject(METADATA);
    await expect(fetchTitleHistory('a', 'title')).resolves.toEqual({ changes: [] });
    expect(fetched.mock.calls.map((call) => call[0])).toEqual([
      '/api/media/a/metadata?scope=season',
      '/api/media/a/metadata/history?scope=title',
    ]);
  });

  it('sends an edit or an undo, answering with the title as it stands or why not', async () => {
    const fetched = vi.fn((_address: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === 'POST'
          ? new Response(JSON.stringify({ error: 'Changed since', code: 'x', values: {} }), {
              status: 409,
            })
          : new Response(JSON.stringify({ changeSetId: 'set', metadata: METADATA })),
      ),
    );

    vi.stubGlobal('fetch', fetched);

    await expect(
      editTitleMetadata('a', 'title', { set: { title: 'Mine' } }),
    ).resolves.toMatchObject({
      kind: 'saved',
      outcome: { changeSetId: 'set', metadata: { fields: METADATA.fields } },
    });
    await expect(undoTitleChange('a', 'title', 'set')).resolves.toEqual({
      kind: 'refused',
      reason: 'Changed since',
    });
    expect(fetched.mock.calls[1]?.[0]).toBe('/api/media/a/metadata/history/set/undo?scope=title');
  });
});
