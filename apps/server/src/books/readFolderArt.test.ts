import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
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

    expect(await readFolderArt(join(root, 'Dune'), true, root)).toEqual({
      bytes: Uint8Array.from([9]),
      contentType: 'image/png',
    });
  });

  it('looks beside a book that is one file on its own', async () => {
    await writeFile(join(root, 'folder.jpg'), Uint8Array.from([4]));

    expect(await readFolderArt(join(root, 'Dune.m4b'), false, root)).toMatchObject({
      contentType: 'image/jpeg',
    });
  });

  it('finds nothing where the folder keeps no cover, or is not there', async () => {
    expect(await readFolderArt(root, true, root)).toBeNull();
    expect(await readFolderArt(join(root, 'Gone'), true, root)).toBeNull();
  });

  it('does not follow a link named like a cover to a file outside the library', async () => {
    const library = join(root, 'library');

    await mkdir(join(library, 'Dune'), { recursive: true });
    await writeFile(join(root, 'secret.env'), 'DB_PASSWORD=hunter2');
    await symlink(join(root, 'secret.env'), join(library, 'Dune', 'cover.jpg'));

    expect(await readFolderArt(join(library, 'Dune'), true, library)).toBeNull();
  });

  it('follows a link to a file elsewhere inside the library', async () => {
    const library = join(root, 'library');

    await mkdir(join(library, 'Dune'), { recursive: true });
    await mkdir(join(library, '_art'));
    await writeFile(join(library, '_art', 'dune.jpg'), Uint8Array.from([7]));
    await symlink(join(library, '_art', 'dune.jpg'), join(library, 'Dune', 'cover.jpg'));

    expect(await readFolderArt(join(library, 'Dune'), true, library)).toEqual({
      bytes: Uint8Array.from([7]),
      contentType: 'image/jpeg',
    });
  });

  it('does not read a link that leads to a folder', async () => {
    const library = join(root, 'library');

    await mkdir(join(library, 'Dune'), { recursive: true });
    await mkdir(join(library, '_art'));
    await symlink(join(library, '_art'), join(library, 'Dune', 'cover.jpg'));

    expect(await readFolderArt(join(library, 'Dune'), true, library)).toBeNull();
  });
});
