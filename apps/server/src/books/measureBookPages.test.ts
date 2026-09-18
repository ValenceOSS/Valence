import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { measureBookPages } from './measureBookPages';

describe('measureBookPages', () => {
  it('says there is nothing rather than failing where no page was ever kept', async () => {
    await expect(measureBookPages('/nowhere-at-all')).resolves.toEqual({ count: 0, bytes: 0 });
  });

  it('adds up every chapter’s pages', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-pages-'));

    await mkdir(join(directory, 'ch_1'));
    await mkdir(join(directory, 'ch_2'));
    await writeFile(join(directory, 'ch_1', '0@1280.webp'), Buffer.alloc(100));
    await writeFile(join(directory, 'ch_1', '1@1280.webp'), Buffer.alloc(50));
    await writeFile(join(directory, 'ch_2', '0@640.webp'), Buffer.alloc(25));

    await expect(measureBookPages(directory)).resolves.toEqual({ count: 3, bytes: 175 });
  });
});
