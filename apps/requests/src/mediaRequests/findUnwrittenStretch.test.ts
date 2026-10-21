import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { findUnwrittenStretch } from './findUnwrittenStretch';

const KIBIBYTE = 1024;

const MEBIBYTE = 1024 * KIBIBYTE;

const folder = { path: '' };

/**
 * Writes a file of bytes that are never zero, with zeros where it is told to leave them.
 *
 * @param name - What to call it.
 * @param bytes - How long it is.
 * @param zeros - Each stretch to leave as zeros, as where it starts and how long it is.
 * @returns It, as a downloaded file.
 */
const aFile = async (
  name: string,
  bytes: number,
  zeros: readonly { from: number; bytes: number }[] = [],
) => {
  const written = new Uint8Array(bytes).map((_, at) => (at % 251) + 1);

  for (const { from, bytes: length } of zeros) {
    written.fill(0, from, from + length);
  }

  const path = join(folder.path, name);

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, written);

  return { path, name, sizeBytes: written.length };
};

/**
 * A torrent of the files given, end to end, as a client would lay it out.
 *
 * @param pieceBytes - How long each piece is.
 * @param files - Each file's name, size and whether it is fetched.
 * @returns The layout.
 */
const aLayout = (
  pieceBytes: number,
  files: readonly { name: string; sizeBytes: number; isWanted?: boolean }[],
) => {
  let offsetBytes = 0;

  return {
    pieceBytes,
    files: files.map((file) => {
      const laid = { ...file, offsetBytes, isWanted: file.isWanted ?? true };

      offsetBytes += file.sizeBytes;

      return laid;
    }),
  };
};

beforeEach(async () => {
  folder.path = await mkdtemp(join(tmpdir(), 'unwritten-'));
});

afterEach(async () => {
  await rm(folder.path, { recursive: true, force: true });
});

describe('findUnwrittenStretch', () => {
  describe('where the client says how the torrent is laid out', () => {
    it('finds a small piece that never arrived, however the torrent was cut', async () => {
      const piece = 256 * KIBIBYTE;
      const file = await aFile('episode.mkv', 80 * MEBIBYTE, [{ from: 37 * piece, bytes: piece }]);
      const layout = aLayout(piece, [{ name: 'episode.mkv', sizeBytes: file.sizeBytes }]);

      expect(await findUnwrittenStretch([file], layout)).toStrictEqual({
        path: file.path,
        fromByte: 37 * piece,
        bytes: piece,
      });
    });

    it('finds the part of a missing piece that falls in a file starting part of the way in', async () => {
      const piece = MEBIBYTE;
      const first = await aFile('Pack/one.mkv', 64 * MEBIBYTE + 300 * KIBIBYTE);
      const second = await aFile('Pack/two.mkv', 70 * MEBIBYTE, [
        { from: 724 * KIBIBYTE + 5 * piece, bytes: piece },
      ]);
      const layout = aLayout(piece, [
        { name: 'Pack/one.mkv', sizeBytes: first.sizeBytes },
        { name: 'Pack/two.mkv', sizeBytes: second.sizeBytes },
      ]);

      expect(await findUnwrittenStretch([first, second], layout)).toStrictEqual({
        path: second.path,
        fromByte: 724 * KIBIBYTE + 5 * piece,
        bytes: piece,
      });
    });

    it('passes zeros that only fill part of a piece, such as padding', async () => {
      const piece = 4 * MEBIBYTE;
      const file = await aFile('episode.mkv', 80 * MEBIBYTE, [
        { from: 8 * MEBIBYTE, bytes: 2 * MEBIBYTE },
      ]);
      const layout = aLayout(piece, [{ name: 'episode.mkv', sizeBytes: file.sizeBytes }]);

      expect(await findUnwrittenStretch([file], layout)).toBeNull();
    });

    it('pays no heed to a file the client was told to skip, which is zeros by design', async () => {
      const piece = MEBIBYTE;
      const wanted = await aFile('Pack/one.mkv', 70 * MEBIBYTE);
      const skipped = await aFile('Pack/two.mkv', 70 * MEBIBYTE, [
        { from: 0, bytes: 70 * MEBIBYTE },
      ]);
      const layout = aLayout(piece, [
        { name: 'Pack/one.mkv', sizeBytes: wanted.sizeBytes },
        { name: 'Pack/two.mkv', sizeBytes: skipped.sizeBytes, isWanted: false },
      ]);

      expect(await findUnwrittenStretch([wanted, skipped], layout)).toBeNull();
    });

    it('passes a file with every piece', async () => {
      const file = await aFile('episode.mkv', 80 * MEBIBYTE);
      const layout = aLayout(MEBIBYTE, [{ name: 'episode.mkv', sizeBytes: file.sizeBytes }]);

      expect(await findUnwrittenStretch([file], layout)).toBeNull();
    });

    it('looks for runs of zeros in a file the torrent does not name', async () => {
      const file = await aFile('renamed.mkv', 80 * MEBIBYTE, [
        { from: 16 * MEBIBYTE, bytes: 2 * MEBIBYTE },
      ]);
      const layout = aLayout(MEBIBYTE, [{ name: 'episode.mkv', sizeBytes: file.sizeBytes }]);

      expect(await findUnwrittenStretch([file], layout)).toMatchObject({ path: file.path });
    });
  });

  describe('where the client cannot say', () => {
    it('finds a run of zeros a mebibyte or longer, wherever it starts', async () => {
      const file = await aFile('episode.mkv', 80 * MEBIBYTE, [
        { from: 10 * MEBIBYTE + 123, bytes: MEBIBYTE + 16 * KIBIBYTE },
      ]);
      const found = await findUnwrittenStretch([file], null);

      expect(found?.bytes).toBeGreaterThanOrEqual(MEBIBYTE);
      expect(found?.fromByte).toBeGreaterThanOrEqual(10 * MEBIBYTE);
    });

    it('passes a shorter run of zeros, which a file can hold as padding', async () => {
      const file = await aFile('episode.mkv', 80 * MEBIBYTE, [
        { from: 8 * MEBIBYTE, bytes: 256 * KIBIBYTE },
      ]);

      expect(await findUnwrittenStretch([file], null)).toBeNull();
    });

    it('finds a stretch at the very end of the file', async () => {
      const file = await aFile('episode.mkv', 80 * MEBIBYTE, [
        { from: 72 * MEBIBYTE, bytes: 8 * MEBIBYTE },
      ]);

      expect(await findUnwrittenStretch([file], null)).toMatchObject({ bytes: 8 * MEBIBYTE });
    });
  });

  it('leaves small files alone, such as a sample or the notes beside it', async () => {
    const file = await aFile('sample.mkv', 8 * MEBIBYTE, [{ from: 0, bytes: 8 * MEBIBYTE }]);

    expect(await findUnwrittenStretch([file], null)).toBeNull();
    expect(
      await findUnwrittenStretch(
        [file],
        aLayout(MEBIBYTE, [{ name: 'sample.mkv', sizeBytes: file.sizeBytes }]),
      ),
    ).toBeNull();
  });
});
