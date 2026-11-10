import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readZipDirectory } from '@ValenceCore/zip/readZipDirectory';
import { aStoredZip } from './aStoredZip';

describe('aStoredZip', () => {
  it('makes a zip whose directory lists every file', async () => {
    const path = join(await mkdtemp(join(tmpdir(), 'zip-')), 'a.zip');

    await writeFile(path, aStoredZip({ 'one.txt': 'one', 'two/two.txt': 'two' }));

    expect((await readZipDirectory(path))?.map((entry) => entry.name)).toEqual([
      'one.txt',
      'two/two.txt',
    ]);
  });
});
