import { mkdtemp, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type * as FsPromises from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { aStoredZip } from '@ValenceCore/testing/aStoredZip';
import { readZipDirectory } from '@ValenceCore/zip/readZipDirectory';

vi.mock('node:fs/promises', async (importOriginal) => ({
  ...(await importOriginal<typeof FsPromises>()),
  statfs: () => Promise.resolve({ bavail: 0, bsize: 4096 }),
}));

const { unpackZipEntry } = await import('./unpackZipEntry');

describe('unpackZipEntry on a full disk', () => {
  it('writes nothing where the disk has no room left', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'zip-'));
    const zip = join(folder, 'a.zip');

    await writeFile(zip, aStoredZip({ 'book.epub': 'the book' }));

    const [entry] = (await readZipDirectory(zip)) ?? [];
    const to = join(folder, 'out', 'book.epub');

    expect(entry === undefined ? true : await unpackZipEntry(zip, entry, to)).toBe(false);
    expect(await stat(to).catch(() => null)).toBeNull();
  });
});
