import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLikeThis } from './fetchLikeThis';

const fetchMock = vi.fn();

const said = (body: object, ok = true) => ({ ok, json: () => Promise.resolve(body) });

const A_FILM = {
  id: '6f1d2c3b-4a59-4e8f-9d7c-1b2a3c4d5e6f',
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Two',
  year: 2026,
  durationSeconds: 5400,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-01T00:00:00.000Z',
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchLikeThis', () => {
  it('reads the titles like one, most alike first', async () => {
    fetchMock.mockResolvedValue(said({ items: [A_FILM] }));

    const found = await fetchLikeThis('9c858901-8a57-4791-81fe-4c455b099bc9');

    expect(found.map((one) => one.title)).toEqual(['Two']);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/media/9c858901-8a57-4791-81fe-4c455b099bc9/like-this',
      expect.anything(),
    );
  });

  it('fails where the server would not answer', async () => {
    fetchMock.mockResolvedValue(said({}, false));

    await expect(fetchLikeThis('9c858901-8a57-4791-81fe-4c455b099bc9')).rejects.toThrow();
  });
});
