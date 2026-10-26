import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Handler = (event: object, ...said: JsonValue[]) => Promise<JsonValue | void> | void;

const { handle } = vi.hoisted(() => ({
  handle: vi.fn<(channel: string, handler: Handler) => void>(),
}));

vi.mock('electron', () => ({ ipcMain: { handle } }));

const { answerAboutListeningFiles } = await import('./answerAboutListeningFiles');
const { DROP_LISTENING, FETCH_LISTENING, HAS_LISTENING, LISTENING_PROGRESS, STOP_LISTENING } =
  await import('./listeningChannels');

const NAME = 'track-one-high.m4a';

const FROM = '/api/music/tracks/one/stream?quality=high';

let folder = '';

/**
 * The handler this process registered for a channel.
 *
 * @param channel - Which channel.
 * @returns Its handler.
 */
const handlerFor = (channel: string): Handler => {
  const found = handle.mock.calls.find(([registered]) => registered === channel)?.[1];

  if (found === undefined) {
    throw new Error(`Nothing answers ${channel}.`);
  }

  return found;
};

/**
 * A body that arrives a piece at a time.
 *
 * @param chunks - The pieces.
 * @param pauseFor - How long to wait before each, in milliseconds.
 * @returns The body.
 */
const streamOf = (chunks: string[], pauseFor = 0): ReadableStream<Uint8Array> =>
  new ReadableStream<Uint8Array>({
    start: async (controller) => {
      for (const chunk of chunks) {
        if (pauseFor > 0) {
          await new Promise((carryOn) => setTimeout(carryOn, pauseFor));
        }

        controller.enqueue(new TextEncoder().encode(chunk));
      }

      controller.close();
    },
  });

/**
 * Sets the answers up against a server that always answers the same way.
 *
 * @param answer - What the server answers.
 * @param server - Where the server is, or nothing where none has been chosen.
 * @returns What was asked of the server, and what the window was told.
 */
const answeringWith = (answer: () => Response, server = 'https://valence.example') => {
  const fetching = vi.fn((_where: string, _how?: RequestInit) => Promise.resolve(answer()));
  const tell = vi.fn<(channel: string, said: JsonValue) => void>();

  answerAboutListeningFiles({ folder, where: () => server, fetching, tell });

  return { fetching, tell };
};

beforeEach(async () => {
  handle.mockReset();
  folder = await mkdtemp(join(tmpdir(), 'valence-listening-'));
});

afterEach(async () => {
  await rm(folder, { recursive: true, force: true });
});

describe('answerAboutListeningFiles', () => {
  it('fetches a song into the listening folder and says it finished', async () => {
    answeringWith(() => new Response('a-song', { headers: { 'content-length': '6' } }));

    const outcome = await handlerFor(FETCH_LISTENING)({}, FROM, NAME);

    expect(outcome).toEqual({ bytes: 6, isComplete: true, failure: null });
    await expect(readFile(join(folder, 'listening', NAME), 'utf8')).resolves.toBe('a-song');
  });

  it('asks the server in use for the file', async () => {
    const { fetching } = answeringWith(() => new Response('a-song'));

    await handlerFor(FETCH_LISTENING)({}, FROM, NAME);

    expect(fetching.mock.calls[0]?.[0]).toBe(`https://valence.example${FROM}`);
  });

  it('says no server has been chosen rather than asking nobody', async () => {
    const { fetching } = answeringWith(() => new Response('a-song'), '');

    const outcome = await handlerFor(FETCH_LISTENING)({}, FROM, NAME);

    expect(outcome).toEqual({
      bytes: 0,
      isComplete: false,
      failure: 'No Valence server has been selected yet.',
    });
    expect(fetching).not.toHaveBeenCalled();
  });

  it('tells the window how far a fetch has got, naming the file', async () => {
    const { tell } = answeringWith(
      () => new Response(streamOf(['a', 'b', 'c'], 300), { headers: { 'content-length': '3' } }),
    );

    await handlerFor(FETCH_LISTENING)({}, FROM, NAME);

    expect(tell).toHaveBeenCalledWith(
      LISTENING_PROGRESS,
      expect.objectContaining({ name: NAME, ofBytes: 3 }),
    );
  });

  it('leaves nothing on the disk where the server refused', async () => {
    answeringWith(() => new Response('no', { status: 404 }));

    const outcome = await handlerFor(FETCH_LISTENING)({}, FROM, NAME);

    expect(outcome).toEqual({
      bytes: 0,
      isComplete: false,
      failure: 'The server responded with 404.',
    });
    await expect(stat(join(folder, 'listening', NAME))).rejects.toThrow();
  });

  it('refuses a name that could climb out of the folder', async () => {
    answeringWith(() => new Response('a-song'));

    await expect(handlerFor(FETCH_LISTENING)({}, FROM, '../escaped.m4a')).rejects.toThrow();
  });

  it('refuses to fetch from anywhere but the server’s own api', async () => {
    const { fetching } = answeringWith(() => new Response('a-song'));

    await expect(
      handlerFor(FETCH_LISTENING)({}, 'https://elsewhere.example/a.m4a', NAME),
    ).rejects.toThrow();
    expect(fetching).not.toHaveBeenCalled();
  });

  it('stops a fetch when asked, as unfinished rather than failed, and lets its piece go', async () => {
    answeringWith(
      () =>
        new Response(streamOf(['a', 'b', 'c', 'd', 'e'], 20), {
          headers: { 'content-length': '5' },
        }),
    );

    const fetched = handlerFor(FETCH_LISTENING)({}, FROM, NAME);

    await new Promise((carryOn) => setTimeout(carryOn, 50));
    await handlerFor(STOP_LISTENING)({}, NAME);

    const outcome = await fetched;

    expect(outcome).toEqual(expect.objectContaining({ isComplete: false, failure: null }));
    await expect(stat(join(folder, 'listening', NAME))).rejects.toThrow();
  });

  it('stops nothing where the file is not being fetched', () => {
    answeringWith(() => new Response('a-song'));

    expect(() => handlerFor(STOP_LISTENING)({}, NAME)).not.toThrow();
  });

  it('lets a kept file go', async () => {
    answeringWith(() => new Response('a-song'));
    await mkdir(join(folder, 'listening'), { recursive: true });
    await writeFile(join(folder, 'listening', NAME), 'a-song');

    await handlerFor(DROP_LISTENING)({}, NAME);

    await expect(stat(join(folder, 'listening', NAME))).rejects.toThrow();
  });

  it('says a file is here only when it holds something', async () => {
    answeringWith(() => new Response('a-song'));
    await mkdir(join(folder, 'listening'), { recursive: true });
    await writeFile(join(folder, 'listening', NAME), 'a-song');
    await writeFile(join(folder, 'listening', 'track-empty-high.m4a'), '');

    const has = handlerFor(HAS_LISTENING);

    expect([
      await has({}, NAME),
      await has({}, 'track-empty-high.m4a'),
      await has({}, 'track-missing-high.m4a'),
    ]).toEqual([true, false, false]);
  });
});
