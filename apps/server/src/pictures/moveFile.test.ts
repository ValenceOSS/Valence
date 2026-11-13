import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isThere } from './isThere';
import { moveFile } from './moveFile';

describe('moveFile', () => {
  it('moves a file, leaving nothing where it was', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-move-'));

    await writeFile(join(folder, 'a'), 'kept');
    await moveFile(join(folder, 'a'), join(folder, 'b'));

    await expect(isThere(join(folder, 'a'))).resolves.toBe(false);
    await expect(readFile(join(folder, 'b'), 'utf8')).resolves.toBe('kept');
  });

  it('says so where there is nothing to move', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-move-'));

    await expect(moveFile(join(folder, 'a'), join(folder, 'b'))).rejects.toThrow();
  });
});
