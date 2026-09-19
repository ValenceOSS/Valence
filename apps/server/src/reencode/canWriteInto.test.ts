import { chmod, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { canWriteInto } from './canWriteInto';

const made: string[] = [];

const somewhere = async (): Promise<string> => {
  const path = await mkdtemp(join(tmpdir(), 'valence-write-'));

  made.push(path);

  return path;
};

afterEach(async () => {
  for (const path of made.splice(0)) {
    await chmod(path, 0o700).catch(() => undefined);
    await rm(path, { recursive: true, force: true });
  }
});

describe('canWriteInto', () => {
  it('says yes where Valence may write, making the directory if it is not there', async () => {
    const root = await somewhere();

    expect(await canWriteInto(join(root, '.valence'))).toBe(true);
  });

  it('leaves nothing behind when it is done asking', async () => {
    const root = await somewhere();
    const directory = join(root, '.valence');

    await canWriteInto(directory);

    expect(await readdir(directory)).toEqual([]);
  });

  it('says no for a folder mounted read only, which is how most people run a media server', async () => {
    const root = await somewhere();

    await chmod(root, 0o500);

    expect(await canWriteInto(join(root, '.valence'))).toBe(false);
  });

  it('says no where the folder could not be made at all', async () => {
    const root = await somewhere();
    const notADirectory = join(root, 'Azkaban.mkv');

    await writeFile(notADirectory, 'the remux');

    expect(await canWriteInto(join(notADirectory, '.valence'))).toBe(false);
  });
});
