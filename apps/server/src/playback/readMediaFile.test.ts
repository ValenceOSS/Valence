import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readMediaFile } from './readMediaFile';

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
});
