import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isStillThere } from './isStillThere';

let folder = '';

beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), 'valence-still-there-'));
});

afterEach(async () => {
  await chmod(join(folder, 'locked'), 0o755).catch(() => undefined);
  await rm(folder, { recursive: true, force: true });
});

describe('isStillThere', () => {
  it('finds a file that is there', async () => {
    await writeFile(join(folder, 'cover.jpg'), 'picture');

    await expect(isStillThere(join(folder, 'cover.jpg'))).resolves.toBe(true);
  });

  it('says a file that has gone is gone', async () => {
    await expect(isStillThere(join(folder, 'cover.jpg'))).resolves.toBe(false);
  });

  it('says a file under something that is not a folder is gone', async () => {
    await writeFile(join(folder, 'file'), 'not a folder');

    await expect(isStillThere(join(folder, 'file', 'cover.jpg'))).resolves.toBe(false);
  });

  it.skipIf(process.getuid?.() === 0)(
    'takes a file it is not allowed to look at to still be there',
    async () => {
      await mkdir(join(folder, 'locked'));
      await writeFile(join(folder, 'locked', 'cover.jpg'), 'picture');
      await chmod(join(folder, 'locked'), 0o000);

      await expect(isStillThere(join(folder, 'locked', 'cover.jpg'))).resolves.toBe(true);
    },
  );
});
