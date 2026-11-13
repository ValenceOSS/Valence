import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aStoredZip } from '@ValenceCore/testing/aStoredZip';
import { readZipDirectory } from '@ValenceCore/zip/readZipDirectory';
import { readZipEntry } from '@ValenceServer/books/readZipEntry';

afterEach(() => {
  vi.restoreAllMocks();
});

const aZipOnDisk = async (): Promise<string> => {
  const path = join(await mkdtemp(join(tmpdir(), 'zip-')), 'a.zip');

  await writeFile(path, aStoredZip({ 'page.xhtml': 'the page' }));

  return path;
};

describe('readZipEntry', () => {
  it('reads one entry of a zip', async () => {
    const path = await aZipOnDisk();
    const [entry] = (await readZipDirectory(path)) ?? [];

    expect(entry === undefined ? null : await readZipEntry(path, entry)).toEqual(
      new TextEncoder().encode('the page'),
    );
  });

  it('reads nothing, and allocates nothing, for an entry claiming to be gigabytes', async () => {
    const path = await aZipOnDisk();
    const [entry] = (await readZipDirectory(path)) ?? [];
    const alloc = vi.spyOn(Buffer, 'alloc');

    expect(
      entry === undefined
        ? 'none'
        : await readZipEntry(path, { ...entry, compressedSize: 0xff_ff_ff_f0 }),
    ).toBeNull();
    expect(alloc.mock.calls.every(([size]) => size <= 1024 * 1024)).toBe(true);
  });

  it('reads nothing of an entry larger than the cap it was given', async () => {
    const path = await aZipOnDisk();
    const [entry] = (await readZipDirectory(path)) ?? [];

    expect(entry === undefined ? 'none' : await readZipEntry(path, entry, 4)).toBeNull();
    expect(entry === undefined ? 'none' : await readZipEntry(path, entry, 64)).not.toBeNull();
  });
});
