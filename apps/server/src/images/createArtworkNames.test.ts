import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createArtworkNames } from './createArtworkNames';

const URL = 'https://image.tmdb.org/t/p/w780/a.jpg';

describe('createArtworkNames', () => {
  it('finds the picture a name stands for', async () => {
    const names = createArtworkNames('secret', await mkdtemp(join(tmpdir(), 'names-')));
    const name = names.nameOf(URL) ?? '';

    await expect(names.urlOf(name)).resolves.toBe(URL);
  });

  it('still knows a name after a restart, from what it wrote down', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'names-'));
    const name = createArtworkNames('secret', directory).nameOf(URL) ?? '';

    await vi.waitFor(async () => {
      await expect(readFile(join(directory, name), 'utf8')).resolves.toBe(URL);
    });
    await expect(createArtworkNames('secret', directory).urlOf(name)).resolves.toBe(URL);
  });

  it('knows nothing of a name it never gave out, or of anything that is not a name', async () => {
    const names = createArtworkNames('secret', await mkdtemp(join(tmpdir(), 'names-')));

    await expect(names.urlOf('0'.repeat(32))).resolves.toBeNull();
    await expect(names.urlOf('../../etc/passwd')).resolves.toBeNull();
  });

  it('refuses a name whose note was written for another picture', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'names-'));
    const name = createArtworkNames('secret', directory).nameOf(URL) ?? '';

    await vi.waitFor(async () => {
      await expect(readFile(join(directory, name), 'utf8')).resolves.toBe(URL);
    });
    await writeFile(join(directory, name), 'https://example.com/other.jpg');

    await expect(createArtworkNames('secret', directory).urlOf(name)).resolves.toBeNull();
  });

  it('names no picture kept beside a title on the disk, which can be replaced at its address', async () => {
    const names = createArtworkNames('secret', await mkdtemp(join(tmpdir(), 'names-')));

    expect(names.nameOf('valence-disk:L21lZGlhL3Bvc3Rlci5qcGc')).toBeNull();
  });
});
