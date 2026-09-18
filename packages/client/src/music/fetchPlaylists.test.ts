import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addToPlaylist,
  createPlaylist,
  dropFromPlaylist,
  moveInPlaylist,
  removePlaylist,
  updatePlaylist,
} from './fetchPlaylists';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const answerWith = (body: JsonValue, ok = true) => {
  fetchMock.mockResolvedValue({ ok, status: ok ? 200 : 404, json: () => Promise.resolve(body) });
};

const SUMMARY = {
  id: '00000000-0000-4000-8000-00000000d0d0',
  name: 'Sunday morning',
  description: null,
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: { profileId: '00000000-0000-4000-8000-000000000001', name: 'Dan', colour: '#fff' },
  entryCount: 0,
  durationSeconds: 0,
  artworkAlbumIds: [],
  updatedAt: '2026-09-18T00:00:00.000Z',
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPlaylists', () => {
  it('makes a playlist and reads it back', async () => {
    answerWith(SUMMARY);

    await expect(createPlaylist({ name: 'Sunday morning' })).resolves.toEqual(SUMMARY);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/playlists',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Sunday morning' }) }),
    );
  });

  it('makes nothing where the server refuses', async () => {
    answerWith({ error: 'Choose a profile first.' }, false);

    await expect(createPlaylist({ name: 'x' })).resolves.toBeNull();
  });

  it('shares a playlist with a patch', async () => {
    answerWith(SUMMARY);

    await expect(updatePlaylist('p', { isShared: true })).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/playlists/p',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('deletes a playlist', async () => {
    answerWith({ removed: true });

    await expect(removePlaylist('p')).resolves.toBe(true);
  });

  it('adds to the end of a playlist', async () => {
    answerWith({ added: 2 });

    await addToPlaylist('p', ['a', 'b']);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/playlists/p/entries',
      expect.objectContaining({ body: JSON.stringify({ mediaItemIds: ['a', 'b'] }) }),
    );
  });

  it('moves an entry to the top by saying it goes after nothing', async () => {
    answerWith({ moved: true });

    await moveInPlaylist('p', 'e', null);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/playlists/p/entries/e',
      expect.objectContaining({ body: JSON.stringify({ afterEntryId: null }) }),
    );
  });

  it('takes an entry out', async () => {
    answerWith({ removed: true });

    await expect(dropFromPlaylist('p', 'e')).resolves.toBe(true);
  });

  it('says a change did not take where the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(removePlaylist('p')).resolves.toBe(false);
  });
});
