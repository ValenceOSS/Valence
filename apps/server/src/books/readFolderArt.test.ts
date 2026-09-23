import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFolderArt } from './readFolderArt';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-folder-art-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('readFolderArt', () => {
  it('reads the cover a book’s folder keeps beside its files', async () => {
    await mkdir(join(root, 'Dune'));
    await writeFile(join(root, 'Dune', 'Cover.PNG'), Uint8Array.from([9]));
    await writeFile(join(root, 'Dune', 'notes.png'), Uint8Array.from([1]));

    expect(await readFolderArt(join(root, 'Dune'), true)).toEqual({
      bytes: Uint8Array.from([9]),
      contentType: 'image/png',
    });
  });

  it('looks beside a book that is one file on its own', async () => {
    await writeFile(join(root, 'folder.jpg'), Uint8Array.from([4]));

    expect(await readFolderArt(join(root, 'Dune.m4b'), false)).toMatchObject({
      contentType: 'image/jpeg',
    });
  });

  it('finds nothing where the folder keeps no cover, or is not there', async () => {
    expect(await readFolderArt(root, true)).toBeNull();
    expect(await readFolderArt(join(root, 'Gone'), true)).toBeNull();
  });
});
