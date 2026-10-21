import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readMediaFile } from './readMediaFile';
import type * as FilePromises from 'node:fs/promises';

const handles = vi.hoisted(() => ({ opened: 0, closed: 0 }));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof FilePromises>();

  return {
    ...actual,
    open: async (...asked: Parameters<typeof actual.open>) => {
      const handle = await actual.open(...asked);
      const close = handle.close.bind(handle);

      handles.opened += 1;
      handle.close = async () => {
        handles.closed += 1;
        await close();
      };

      return handle;
    },
  };
});

beforeEach(() => {
  handles.opened = 0;
  handles.closed = 0;
});

/**
 * Writes a file of known bytes to read back.
 *
 * @param size - How many bytes it holds, each its own position modulo 256.
 * @returns Where it is.
 */
const aFileOf = async (size: number): Promise<string> => {
  const path = join(await mkdtemp(join(tmpdir(), 'valence-direct-')), 'Episode.mkv');

  await writeFile(
    path,
    Uint8Array.from({ length: size }, (_, at) => at % 256),
  );

  return path;
};

describe('readMediaFile', () => {
  it('sends the whole file where no range is asked for', async () => {
    const path = await aFileOf(3 * 1024 * 1024 + 7);
    const file = await readMediaFile(path, null);
    const bytes = new Uint8Array(await new Response(file?.body).arrayBuffer());

    expect(file?.status).toBe(200);
    expect(file?.contentLength).toBe((3 * 1024 * 1024 + 7).toString());
    expect(file?.contentType).toBe('application/octet-stream');
    expect(bytes.length).toBe(3 * 1024 * 1024 + 7);
    expect(bytes[1024 * 1024 + 5]).toBe((1024 * 1024 + 5) % 256);
  });

  it('sends exactly the bytes of a range, with where they sit in the file', async () => {
    const path = await aFileOf(5000);
    const file = await readMediaFile(path, 'bytes=1000-1999');
    const bytes = new Uint8Array(await new Response(file?.body).arrayBuffer());

    expect(file?.status).toBe(206);
    expect(file?.contentRange).toBe('bytes 1000-1999/5000');
    expect(file?.contentLength).toBe('1000');
    expect(bytes.length).toBe(1000);
    expect(bytes[0]).toBe(1000 % 256);
  });

  it('leaves a file it cannot open to the media service', async () => {
    expect(await readMediaFile('/nowhere/at/all.mkv', null)).toBeNull();
  });

  it('opens nothing until the response is read, so one a player abandoned holds nothing open', async () => {
    await readMediaFile(await aFileOf(4096), null);

    expect(handles.opened).toBe(0);
  });

  it('closes the file once the range is sent', async () => {
    const file = await readMediaFile(await aFileOf(4096), 'bytes=10-19');

    await new Response(file?.body).arrayBuffer();

    expect(handles).toEqual({ opened: 1, closed: 1 });
  });

  it('closes the file when the player goes part of the way through', async () => {
    const reader = (await readMediaFile(await aFileOf(3 * 1024 * 1024), null))?.body.getReader();

    await reader?.read();
    await reader?.cancel();

    expect(handles).toEqual({ opened: 1, closed: 1 });
  });

  it('sends nothing of an empty file, and opens nothing for it', async () => {
    const file = await readMediaFile(await aFileOf(0), null);

    expect((await new Response(file?.body).arrayBuffer()).byteLength).toBe(0);
    expect(handles.opened).toBe(0);
  });
});
