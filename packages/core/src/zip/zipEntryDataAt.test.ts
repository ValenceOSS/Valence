import { mkdtemp, open, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aStoredZip } from '@ValenceCore/testing/aStoredZip';
import { readZipDirectory } from '@ValenceCore/zip/readZipDirectory';
import { zipEntryDataAt } from './zipEntryDataAt';

describe('zipEntryDataAt', () => {
  it('finds where an entry starts, past its local header and name', async () => {
    const zip = join(await mkdtemp(join(tmpdir(), 'zip-')), 'a.zip');

    await writeFile(zip, aStoredZip({ 'ab.txt': 'hello' }));

    const [entry] = (await readZipDirectory(zip)) ?? [];
    const file = await open(zip, 'r');

    try {
      expect(entry === undefined ? null : await zipEntryDataAt(file, entry)).toBe(
        30 + 'ab.txt'.length,
      );
      expect(
        entry === undefined ? null : await zipEntryDataAt(file, { ...entry, headerOffset: 5 }),
      ).toBeNull();
    } finally {
      await file.close();
    }
  });
});
