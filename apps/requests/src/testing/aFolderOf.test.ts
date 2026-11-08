import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aFolderOf } from './aFolderOf';

describe('aFolderOf', () => {
  it('writes each file where it is named, making the folders it is in', async () => {
    const folder = await aFolderOf({ 'one.txt': '1', 'deep/down/two.txt': '2' });

    await expect(readFile(join(folder, 'one.txt'), 'utf8')).resolves.toBe('1');
    await expect(readFile(join(folder, 'deep/down/two.txt'), 'utf8')).resolves.toBe('2');
  });
});
