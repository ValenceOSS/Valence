import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aFolderOf } from '@ValenceRequests/testing/aFolderOf';
import { numberInFile } from './numberInFile';

describe('numberInFile', () => {
  it('reads the number a file holds', async () => {
    const folder = await aFolderOf({ 'memory.current': '268435456\n' });

    await expect(numberInFile(join(folder, 'memory.current'))).resolves.toBe(268_435_456);
  });

  it('says nothing for a word, an empty file or one that is not there', async () => {
    const folder = await aFolderOf({ 'memory.max': 'max\n', empty: '' });

    await expect(numberInFile(join(folder, 'memory.max'))).resolves.toBeNull();
    await expect(numberInFile(join(folder, 'empty'))).resolves.toBeNull();
    await expect(numberInFile(join(folder, 'missing'))).resolves.toBeNull();
  });
});
