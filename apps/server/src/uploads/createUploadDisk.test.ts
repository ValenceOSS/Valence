import { chmod, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createUploadDisk } from './createUploadDisk';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-uploads-'));
});

afterEach(async () => {
  await chmod(root, 0o755).catch(() => undefined);
  await rm(root, { recursive: true, force: true });
});

const bodyOf = (text: string): ReadableStream<Uint8Array> =>
  new Response(text).body ?? new ReadableStream();

const failingBody = (): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start: (controller) => {
      controller.enqueue(new TextEncoder().encode('half'));
      controller.error(new Error('the connection dropped'));
    },
  });

describe('createUploadDisk', () => {
  it('writes what arrives, and says how much', async () => {
    const at = join(root, 'Arrival.mkv');

    await expect(createUploadDisk().write(at, bodyOf('a film'))).resolves.toEqual({
      kind: 'written',
      bytes: 6,
    });
    expect(await readFile(at, 'utf8')).toBe('a film');
  });

  it('makes the folders the file goes in', async () => {
    const at = join(root, 'Show', 'Season 1', 'S01E01.mkv');

    await expect(createUploadDisk().write(at, bodyOf('x'))).resolves.toMatchObject({
      kind: 'written',
    });
    expect(await readFile(at, 'utf8')).toBe('x');
  });

  it('never replaces what is already there', async () => {
    const at = join(root, 'Arrival.mkv');

    await writeFile(at, 'the original');

    await expect(createUploadDisk().write(at, bodyOf('another'))).resolves.toEqual({
      kind: 'exists',
    });
    expect(await readFile(at, 'utf8')).toBe('the original');
  });

  it('leaves nothing behind when the connection drops part of the way', async () => {
    const at = join(root, 'Arrival.mkv');

    await expect(createUploadDisk().write(at, failingBody())).resolves.toEqual({ kind: 'failed' });
    expect(await readdir(root)).toEqual([]);
  });

  it('never shows a file to a scan before all of it has arrived', async () => {
    const at = join(root, 'Arrival.mkv');
    let seen: string[] = [];

    const body = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        controller.enqueue(new TextEncoder().encode('first'));
        await new Promise((done) => setTimeout(done, 20));
        seen = await readdir(root);
        controller.close();
      },
    });

    await createUploadDisk().write(at, body);

    expect(seen.some((name) => name === 'Arrival.mkv')).toBe(false);
    expect(seen.every((name) => name.startsWith('.'))).toBe(true);
  });

  it.skipIf(process.getuid?.() === 0)('says so where it is not allowed to write', async () => {
    const locked = join(root, 'locked');

    await mkdir(locked);
    await chmod(locked, 0o555);

    await expect(
      createUploadDisk().write(join(locked, 'Arrival.mkv'), bodyOf('x')),
    ).resolves.toEqual({ kind: 'denied' });

    await chmod(locked, 0o755);
  });
});
