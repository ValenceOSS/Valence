import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UPLOAD_PIECE_BYTES } from '@ValenceContracts/schemas/UploadPieces';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readUnfinishedUploads } from './unfinishedUploads';
import { uploadMedia } from './uploadMedia';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const FILE = new File(['a film'], 'Arrival.mkv');

const UPLOAD_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const UPLOAD = `/api/libraries/lib-1/uploads/${UPLOAD_ID}`;

const answer = (status: number, body: JsonValue): Answer => ({
  ok: status < 400,
  status,
  json: () => Promise.resolve(body),
});

/**
 * A file the size of two and a half pieces, without holding that much in memory.
 *
 * @returns The file.
 */
const largeFile = (): File => {
  const file = new File(['a long film'], 'Arrival.mkv');

  Object.defineProperty(file, 'size', { value: UPLOAD_PIECE_BYTES * 2.5 });

  return file;
};

/**
 * Answers as a server taking uploads in pieces does, with a piece that fails as told.
 *
 * @param failPiece - What to do the first times a piece is sent, keyed by its index.
 */
const answerInPieces = (failPiece: Record<number, Array<'drop' | number>> = {}) => {
  const received = new Set<number>();

  fetchMock.mockImplementation((input, init) => {
    const method = init?.method ?? 'GET';
    const piece = /\/pieces\/(\d+)$/.exec(input);

    if (input.includes('/uploads/start')) {
      return Promise.resolve(
        answer(201, { uploadId: UPLOAD_ID, pieceBytes: UPLOAD_PIECE_BYTES, pieces: 3 }),
      );
    }

    if (piece !== null) {
      const index = Number(piece[1]);
      const failure = failPiece[index]?.shift();

      if (failure === 'drop') {
        return Promise.reject(new Error('the connection dropped'));
      }

      if (failure !== undefined) {
        return Promise.resolve(answer(failure, { error: 'That piece did not arrive whole.' }));
      }

      received.add(index);

      return Promise.resolve(answer(200, { received: [...received], pieces: 3 }));
    }

    if (input.endsWith('/finish')) {
      return Promise.resolve(answer(201, { path: 'Arrival.mkv', bytes: UPLOAD_PIECE_BYTES * 2.5 }));
    }

    return Promise.resolve(
      method === 'DELETE' ? answer(204, null) : answer(200, { received: [...received], pieces: 3 }),
    );
  });
};

const pieceSends = (): string[] =>
  fetchMock.mock.calls.map(([input]) => input).filter((input) => input.includes('/pieces/'));

const pauseFor = () => Promise.resolve();

beforeEach(() => {
  installPlatform(aFakePlatform());
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(answer(201, { path: 'Arrival/Arrival.mkv', bytes: 6 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('uploadMedia', () => {
  it('sends the file itself as the body, to the library, with where it goes in the address', async () => {
    await uploadMedia('lib-1', 'Arrival & Co/Arrival.mkv', FILE);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/libraries/lib-1/uploads?path=Arrival+%26+Co%2FArrival.mkv',
      {
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream' },
        body: FILE,
        signal: null,
      },
    );
  });

  it('says where it was put and how much arrived', async () => {
    await expect(uploadMedia('lib-1', 'Arrival/Arrival.mkv', FILE)).resolves.toEqual({
      path: 'Arrival/Arrival.mkv',
      bytes: 6,
    });
  });

  it('says what the server said when it would not take it', async () => {
    fetchMock.mockResolvedValue(answer(403, { error: 'That disk is read-only to Valence.' }));

    await expect(uploadMedia('lib-1', 'a.mkv', FILE)).rejects.toThrow(
      'That disk is read-only to Valence.',
    );
  });

  it('still says something when the server answered with no words', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(uploadMedia('lib-1', 'a.mkv', FILE)).rejects.toThrow(
      'The file could not be uploaded.',
    );
  });
});

describe('uploadMedia, for a file larger than a piece', () => {
  it('begins an upload of its size, sends each piece, and finishes it', async () => {
    answerInPieces();
    const onProgress = vi.fn<(fraction: number) => void>();

    await expect(
      uploadMedia('lib-1', 'Arrival.mkv', largeFile(), { onProgress, pauseFor }),
    ).resolves.toEqual({ path: 'Arrival.mkv', bytes: UPLOAD_PIECE_BYTES * 2.5 });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `/api/libraries/lib-1/uploads/start?path=Arrival.mkv&bytes=${(UPLOAD_PIECE_BYTES * 2.5).toString()}`,
    );
    expect(pieceSends()).toEqual([0, 1, 2].map((index) => `${UPLOAD}/pieces/${index.toString()}`));
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(`${UPLOAD}/finish`);
    expect(onProgress.mock.calls.map(([fraction]) => fraction)).toEqual([1 / 3, 2 / 3, 1]);
  });

  it('sends a piece again when the connection drops or the server stumbles, and no other', async () => {
    answerInPieces({ 1: ['drop', 503] });

    await uploadMedia('lib-1', 'Arrival.mkv', largeFile(), { pauseFor });

    expect(pieceSends()).toEqual([
      `${UPLOAD}/pieces/0`,
      `${UPLOAD}/pieces/1`,
      `${UPLOAD}/pieces/1`,
      `${UPLOAD}/pieces/1`,
      `${UPLOAD}/pieces/2`,
    ]);
    expect(fetchMock).toHaveBeenCalledWith(UPLOAD, { signal: null });
  });

  it('gives up on a piece the server refuses, and throws the upload away', async () => {
    answerInPieces({ 0: [400] });

    await expect(uploadMedia('lib-1', 'Arrival.mkv', largeFile(), { pauseFor })).rejects.toThrow(
      'That piece did not arrive whole.',
    );
    expect(fetchMock).toHaveBeenCalledWith(UPLOAD, { method: 'DELETE' });
  });

  it('gives up after trying a piece a few times, keeping the upload to carry on later', async () => {
    answerInPieces({ 2: ['drop', 'drop', 'drop', 'drop'] });

    await expect(uploadMedia('lib-1', 'Arrival.mkv', largeFile(), { pauseFor })).rejects.toThrow(
      'the connection dropped',
    );
    expect(pieceSends().filter((input) => input.endsWith('/2'))).toHaveLength(4);
    expect(fetchMock).not.toHaveBeenCalledWith(UPLOAD, { method: 'DELETE' });
    expect(readUnfinishedUploads('lib-1')).toEqual([
      expect.objectContaining({ path: 'Arrival.mkv', uploadId: UPLOAD_ID }),
    ]);
  });

  it('stops at once and throws the upload away when it is cancelled', async () => {
    answerInPieces({ 0: ['drop'] });
    const cancelling = new AbortController();

    cancelling.abort();

    await expect(
      uploadMedia('lib-1', 'Arrival.mkv', largeFile(), { signal: cancelling.signal, pauseFor }),
    ).rejects.toThrow('the connection dropped');
    expect(pieceSends()).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(UPLOAD, { method: 'DELETE' });
  });

  it('carries the same file on from the pieces the server has, and forgets it once finished', async () => {
    const file = largeFile();

    answerInPieces({ 2: ['drop', 'drop', 'drop', 'drop'] });
    await uploadMedia('lib-1', 'Arrival.mkv', file, { pauseFor }).catch(() => null);
    fetchMock.mockClear();
    answerInPieces();

    const onProgress = vi.fn();

    await uploadMedia('lib-1', 'Arrival.mkv', file, { onProgress, pauseFor });

    expect(fetchMock.mock.calls.some(([input]) => input.includes('/start'))).toBe(false);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(UPLOAD);
    expect(onProgress.mock.calls[0]?.[0]).toBe(0);
    expect(readUnfinishedUploads('lib-1')).toEqual([]);
  });

  it('begins again where the server no longer has the upload it was carrying on', async () => {
    const file = largeFile();

    answerInPieces({ 2: ['drop', 'drop', 'drop', 'drop'] });
    await uploadMedia('lib-1', 'Arrival.mkv', file, { pauseFor }).catch(() => null);
    fetchMock.mockClear();
    answerInPieces();

    const answered = fetchMock.getMockImplementation();

    fetchMock.mockImplementation((input, init) =>
      input === UPLOAD && init?.method === undefined
        ? Promise.resolve(answer(404, { error: 'No such upload.' }))
        : (answered?.(input, init) ?? Promise.reject(new Error('unanswered'))),
    );

    await uploadMedia('lib-1', 'Arrival.mkv', file, { pauseFor });

    expect(fetchMock.mock.calls.some(([input]) => input.includes('/start'))).toBe(true);
  });

  it('says what the server said where it would not begin', async () => {
    fetchMock.mockResolvedValue(answer(409, { error: 'There is already a file called that.' }));

    await expect(uploadMedia('lib-1', 'Arrival.mkv', largeFile(), { pauseFor })).rejects.toThrow(
      'There is already a file called that.',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
