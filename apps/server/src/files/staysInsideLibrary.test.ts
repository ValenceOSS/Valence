import { mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aLibraryAt } from './aLibraryAt';
import { staysInsideLibrary } from './staysInsideLibrary';

let root = '';
let elsewhere = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-files-'));
  elsewhere = await mkdtemp(join(tmpdir(), 'valence-elsewhere-'));
  await mkdir(join(root, 'films'));
  await symlink(elsewhere, join(root, 'films', 'link'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  await rm(elsewhere, { recursive: true, force: true });
});

describe('staysInsideLibrary', () => {
  it('lets a real path inside the library through, and one where nothing is yet below it', async () => {
    const library = aLibraryAt(join(root, 'films'));

    await expect(staysInsideLibrary(library, join(root, 'films'))).resolves.toBe(true);
    await expect(staysInsideLibrary(library, join(root, 'films', 'Gone'))).resolves.toBe(true);
  });

  it('refuses a path that goes through a link leading out of the library', async () => {
    const library = aLibraryAt(join(root, 'films'));

    await expect(staysInsideLibrary(library, join(root, 'films', 'link'))).resolves.toBe(false);
    await expect(staysInsideLibrary(library, join(root, 'films', 'link', 'a.mkv'))).resolves.toBe(
      false,
    );
  });
});
