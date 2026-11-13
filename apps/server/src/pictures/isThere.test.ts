import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isThere } from './isThere';

describe('isThere', () => {
  it('says whether a file is there', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-there-'));

    await writeFile(join(folder, 'a'), 'a');

    await expect(isThere(join(folder, 'a'))).resolves.toBe(true);
    await expect(isThere(join(folder, 'b'))).resolves.toBe(false);
  });
});
