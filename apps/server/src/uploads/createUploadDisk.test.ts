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

describe('createUploadDisk, in pieces', () => {
  it('puts each piece at its own place, in whatever order they come', async () => {
    const at = join(root, 'Arrival.mkv');
    const staging = join(root, '.Arrival.mkv.one.part');
    const disk = createUploadDisk();

    await expect(disk.begin(at, staging)).resolves.toEqual({ kind: 'begun' });
    await expect(disk.writeAt(staging, 4, bodyOf('film'))).resolves.toEqual({
      kind: 'written',
      bytes: 4,
    });
    await disk.writeAt(staging, 0, bodyOf('a ; '));
    await disk.writeAt(staging, 0, bodyOf('a : '));

    await expect(disk.finish(staging, at, 8)).resolves.toEqual({ kind: 'written', bytes: 8 });
    expect(await readFile(at, 'utf8')).toBe('a : film');
    expect(await readdir(root)).toEqual(['Arrival.mkv']);
  });

  it('cuts off anything past the size it was said to be', async () => {
    const at = join(root, 'Arrival.mkv');
    const staging = join(root, '.Arrival.mkv.one.part');
    const disk = createUploadDisk();

    await disk.begin(at, staging);
    await disk.writeAt(staging, 0, bodyOf('a film and more'));

    await expect(disk.finish(staging, at, 6)).resolves.toEqual({ kind: 'written', bytes: 6 });
    expect(await readFile(at, 'utf8')).toBe('a film');
  });

  it('begins nothing where a file is already there, and finishes onto nothing there either', async () => {
    const at = join(root, 'Arrival.mkv');
    const staging = join(root, '.Arrival.mkv.one.part');
    const disk = createUploadDisk();

    await disk.begin(at, staging);
    await writeFile(at, 'the original');

    await expect(disk.begin(at, join(root, '.two.part'))).resolves.toEqual({ kind: 'exists' });
    await expect(disk.finish(staging, at, 0)).resolves.toEqual({ kind: 'exists' });
    expect(await readFile(at, 'utf8')).toBe('the original');
  });

  it('throws away a staging file, and does not mind one already gone', async () => {
    const staging = join(root, '.Arrival.mkv.one.part');
    const disk = createUploadDisk();

    await disk.begin(join(root, 'Arrival.mkv'), staging);
    await disk.discard(staging);
    await disk.discard(staging);

    expect(await readdir(root)).toEqual([]);
  });

  it('says a piece failed where there is no staging file to write it into', async () => {
    await expect(
      createUploadDisk().writeAt(join(root, '.missing.part'), 0, bodyOf('x')),
    ).resolves.toEqual({ kind: 'failed' });
  });
});
