import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { moveFile } from './moveFile';

describe('moveFile', () => {
  let root = '';

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'move-file-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('moves a file into a folder it makes on the way', async () => {
    await writeFile(join(root, 'a.mkv'), 'film');
    await moveFile(join(root, 'a.mkv'), join(root, 'new', 'deeper', 'b.mkv'));

    expect(await readFile(join(root, 'new', 'deeper', 'b.mkv'), 'utf8')).toBe('film');
    await expect(readFile(join(root, 'a.mkv'))).rejects.toThrow();
  });
});
