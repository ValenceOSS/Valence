import { existsSync } from 'node:fs';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { forgetUnpacked } from './forgetUnpacked';

describe('forgetUnpacked', () => {
  it('takes the folders away, and minds none that are already gone', async () => {
    const folder = join(await mkdtemp(join(tmpdir(), 'unpacked-')), '.valence-unpacked', 'book');

    await mkdir(folder, { recursive: true });
    await forgetUnpacked([folder, join(tmpdir(), 'never-there')]);

    expect(existsSync(folder)).toBe(false);
  });
});
