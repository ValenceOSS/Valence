import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { giveUpUpload } from './giveUpUpload';
import { readUnfinishedUploads, rememberUnfinishedUpload } from './unfinishedUploads';

const UPLOAD = {
  key: 'a',
  libraryId: 'films',
  path: 'Arrival.mkv',
  bytes: 10,
  uploadId: 'upload-1',
  pieceBytes: 5,
  startedAt: '2026-09-24T00:00:00.000Z',
};

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<{ ok: boolean }>>();

beforeEach(() => {
  installPlatform(aFakePlatform());
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('giveUpUpload', () => {
  it('has the server throw it away, and forgets it here', async () => {
    rememberUnfinishedUpload(UPLOAD);

    await giveUpUpload(UPLOAD);

    expect(fetchMock).toHaveBeenCalledWith('/api/libraries/films/uploads/upload-1', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    expect(readUnfinishedUploads()).toEqual([]);
  });

  it('forgets it here even where the server cannot be reached', async () => {
    rememberUnfinishedUpload(UPLOAD);
    fetchMock.mockRejectedValue(new Error('offline'));

    await giveUpUpload(UPLOAD);

    expect(readUnfinishedUploads()).toEqual([]);
  });
});
