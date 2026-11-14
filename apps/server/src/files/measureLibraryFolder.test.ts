import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aLibraryAt } from './aLibraryAt';
import { measureLibraryFolder } from './measureLibraryFolder';

let root = '';
let elsewhere = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-measure-'));
  elsewhere = await mkdtemp(join(tmpdir(), 'valence-elsewhere-'));
  await mkdir(join(root, 'Season 1'));
  await mkdir(join(root, '.hidden'));
  await writeFile(join(root, 'Arrival.mkv'), 'a film');
  await writeFile(join(root, 'Season 1', 'one.mkv'), 'abc');
  await writeFile(join(root, '.hidden', 'x'), 'unseen');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  await rm(elsewhere, { recursive: true, force: true });
});

describe('measureLibraryFolder', () => {
  it('adds up the files and folders, passing over hidden ones', async () => {
    const answer = await measureLibraryFolder([aLibraryAt(root)], root);

    expect(answer).toEqual({
      kind: 'measured',
      measure: { sizeBytes: 9, files: 2, folders: 1, isPartial: false },
    });
  });

  it('does not follow a link out of the library, nor count what it leads to', async () => {
    await mkdir(join(elsewhere, 'deep'));
    await writeFile(join(elsewhere, 'deep', 'big.bin'), 'x'.repeat(1000));
    await symlink(elsewhere, join(root, 'Outside'));
    await symlink(root, join(root, 'Season 1', 'Loop'));
    await symlink(join(elsewhere, 'deep', 'big.bin'), join(root, 'linked.bin'));

    const answer = await measureLibraryFolder([aLibraryAt(root)], root);

    expect(answer).toEqual({
      kind: 'measured',
      measure: { sizeBytes: 9, files: 2, folders: 1, isPartial: false },
    });
  });
});
