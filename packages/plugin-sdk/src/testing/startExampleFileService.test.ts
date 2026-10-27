import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { startExampleFileService } from './startExampleFileService';
import type { ExampleFileService } from './startExampleFileService';

const READY = 'a'.repeat(40);

const SLOW = 'b'.repeat(40);

let service: ExampleFileService;
let clock = 0;

beforeEach(async () => {
  const folder = await mkdtemp(join(tmpdir(), 'example-files-'));
  const film = join(folder, 'film.mkv');

  await writeFile(film, '0123456789');
  clock = 1_000_000;
  service = await startExampleFileService({
    entries: [
      {
        infoHash: READY,
        name: 'Film.2001.1080p',
        tmdbId: '1',
        files: [{ name: 'film.mkv', path: film }],
        isReady: true,
      },
      {
        infoHash: SLOW,
        name: 'Film.2001.720p',
        files: [{ name: 'film.mkv', path: film }],
        isReady: false,
        prepareSeconds: 10,
      },
    ],
    key: 'secret',
    linkSeconds: 60,
    now: () => clock,
  });
});

afterEach(async () => {
  await service.stop();
});

const ask = (path: string, init: RequestInit = {}) =>
  fetch(`${service.origin}${path}`, {
    ...init,
    headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
  });

describe('a stand-in remote file service', () => {
  it('refuses a wrong key', async () => {
    expect((await fetch(`${service.origin}/v1/account`)).status).toBe(401);
  });

  it('says which hashes it has ready, and lists what it holds for a film', async () => {
    const ready = await ask('/v1/ready', {
      method: 'POST',
      body: JSON.stringify({ hashes: [READY, SLOW] }),
    });
    const search = await ask('/v1/search?tmdb=1');

    expect(await ready.json()).toEqual({ ready: [READY] });
    expect(await search.json()).toEqual({
      results: [{ infoHash: READY, name: 'Film.2001.1080p', sizeBytes: 10, isReady: true }],
    });
  });

  it('prepares a download over time, then hands out a link that serves ranges and expires', async () => {
    const added = await ask('/v1/items', {
      method: 'POST',
      body: JSON.stringify({ infoHash: SLOW }),
    });
    const { id } = z.object({ id: z.string() }).parse(await added.json());

    expect((await ask(`/v1/items/${id}/files`)).status).toBe(409);

    clock += 5_000;
    expect(await (await ask(`/v1/items?ids=${id}`)).json()).toMatchObject({
      items: [{ id, state: 'downloading', progress: 0.5, doneBytes: 5 }],
    });

    clock += 5_000;

    const files = z
      .object({ files: z.array(z.object({ url: z.string() })).length(1) })
      .parse(await (await ask(`/v1/items/${id}/files`)).json());
    const url = new URL(files.files[0]?.url ?? '');
    const part = await fetch(`${service.origin}${url.pathname}`, {
      headers: { range: 'bytes=4-' },
    });

    expect(part.status).toBe(206);
    expect(part.headers.get('content-range')).toBe('bytes 4-9/10');
    expect(await part.text()).toBe('456789');

    clock += 61_000;
    expect((await fetch(`${service.origin}${url.pathname}`)).status).toBe(410);
  });

  it('answers a link for a ready hash straight away, and starts preparing one that is not', async () => {
    const ready = await ask('/v1/links', {
      method: 'POST',
      body: JSON.stringify({ infoHash: READY }),
    });
    const slow = await ask('/v1/links', {
      method: 'POST',
      body: JSON.stringify({ infoHash: SLOW }),
    });

    expect(ready.status).toBe(200);
    expect(await ready.json()).toMatchObject({ fileName: 'film.mkv', sizeBytes: 10 });
    expect(slow.status).toBe(202);
    expect(await slow.json()).toEqual({ progress: 0 });
  });
});
