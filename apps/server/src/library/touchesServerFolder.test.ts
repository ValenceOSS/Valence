import { mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { touchesServerFolder } from './touchesServerFolder';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-folders-'));
  await mkdir(join(root, 'config', 'backups'), { recursive: true });
  await mkdir(join(root, 'media'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('touchesServerFolder', () => {
  it('refuses a folder that is one the server keeps, holds one, or is inside one', async () => {
    const kept = [join(root, 'config', 'backups')];

    await expect(touchesServerFolder(join(root, 'config', 'backups'), kept)).resolves.toBe(true);
    await expect(touchesServerFolder(join(root, 'config'), kept)).resolves.toBe(true);
    await expect(touchesServerFolder(root, kept)).resolves.toBe(true);
    await expect(touchesServerFolder(join(root, 'config', 'backups', 'a'), kept)).resolves.toBe(
      true,
    );
  });

  it('refuses a link that leads to one', async () => {
    await symlink(join(root, 'config'), join(root, 'media', 'link'));

    await expect(
      touchesServerFolder(join(root, 'media', 'link'), [join(root, 'config', 'backups')]),
    ).resolves.toBe(true);
  });

  it('refuses the root of the disk, which holds them all', async () => {
    await expect(touchesServerFolder('/', [join(root, 'config')])).resolves.toBe(true);
  });

  it('lets a folder beside them through', async () => {
    await expect(
      touchesServerFolder(join(root, 'media'), [join(root, 'config', 'backups')]),
    ).resolves.toBe(false);
  });
});
