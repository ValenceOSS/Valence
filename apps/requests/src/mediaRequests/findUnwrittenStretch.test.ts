import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findUnwrittenStretch } from './findUnwrittenStretch';

const MEBIBYTE = 1024 * 1024;

const folder = { path: '' };

/**
 * Writes a file of bytes that are never zero, with zeros where it is told to leave them.
 *
 * @param name - What to call it.
 * @param mebibytes - How long it is.
 * @param zeros - Each stretch to leave as zeros, as where it starts and how long it is, in bytes.
 * @returns It, as a downloaded file.
 */
const aFile = async (
  name: string,
  mebibytes: number,
  zeros: readonly { from: number; bytes: number }[] = [],
) => {
  const bytes = new Uint8Array(mebibytes * MEBIBYTE).map((_, at) => (at % 251) + 1);

  for (const { from, bytes: length } of zeros) {
    bytes.fill(0, from, from + length);
  }

  const path = join(folder.path, name);

  await writeFile(path, bytes);

  return { path, name, sizeBytes: bytes.length };
};

beforeEach(async () => {
  folder.path = await mkdtemp(join(tmpdir(), 'unwritten-'));
});

afterEach(async () => {
  await rm(folder.path, { recursive: true, force: true });
});

describe('findUnwrittenStretch', () => {
  it('finds a piece that was never written, and says where it is', async () => {
    const file = await aFile('episode.mkv', 80, [{ from: 16 * MEBIBYTE, bytes: 16 * MEBIBYTE }]);

    expect(await findUnwrittenStretch([file])).toStrictEqual({
      path: file.path,
      fromByte: 16 * MEBIBYTE,
      bytes: 16 * MEBIBYTE,
    });
  });

  it('finds a piece that does not start where a slice is read', async () => {
    const file = await aFile('episode.mkv', 80, [
      { from: 10 * MEBIBYTE + 123, bytes: 5 * MEBIBYTE },
    ]);
    const found = await findUnwrittenStretch([file]);

    expect(found?.bytes).toBeGreaterThanOrEqual(4 * MEBIBYTE);
    expect(found?.fromByte).toBeGreaterThanOrEqual(10 * MEBIBYTE);
  });

  it('passes a file with every piece', async () => {
    expect(await findUnwrittenStretch([await aFile('episode.mkv', 80)])).toBeNull();
  });

  it('passes a short run of zeros, which a file can hold as padding', async () => {
    const file = await aFile('episode.mkv', 80, [{ from: 8 * MEBIBYTE, bytes: 256 * 1024 }]);

    expect(await findUnwrittenStretch([file])).toBeNull();
  });

  it('leaves small files alone, such as a sample or the notes beside it', async () => {
    const file = await aFile('sample.mkv', 8, [{ from: 0, bytes: 8 * MEBIBYTE }]);

    expect(await findUnwrittenStretch([file])).toBeNull();
  });

  it('finds a stretch at the very end of the file', async () => {
    const file = await aFile('episode.mkv', 80, [{ from: 72 * MEBIBYTE, bytes: 8 * MEBIBYTE }]);

    expect(await findUnwrittenStretch([file])).toMatchObject({ bytes: 8 * MEBIBYTE });
  });

  it('looks through every file of a pack', async () => {
    const whole = await aFile('one.mkv', 70);
    const broken = await aFile('two.mkv', 70, [{ from: 32 * MEBIBYTE, bytes: 4 * MEBIBYTE }]);

    expect(await findUnwrittenStretch([whole, broken])).toMatchObject({ path: broken.path });
  });
});
