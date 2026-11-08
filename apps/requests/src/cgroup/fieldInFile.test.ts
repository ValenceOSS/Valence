import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aFolderOf } from '@ValenceRequests/testing/aFolderOf';
import { fieldInFile } from './fieldInFile';

describe('fieldInFile', () => {
  it('reads a field by its whole name', async () => {
    const folder = await aFolderOf({
      'cpu.stat': 'usage_usec 4500000\nuser_usec 4000000\n',
      'memory.stat': 'total_inactive_file 900\ninactive_file 600\n',
    });

    await expect(fieldInFile(join(folder, 'cpu.stat'), 'usage_usec')).resolves.toBe(4_500_000);
    await expect(fieldInFile(join(folder, 'memory.stat'), 'inactive_file')).resolves.toBe(600);
  });

  it('says nothing for a field or a file that is not there', async () => {
    const folder = await aFolderOf({ 'cpu.stat': 'user_usec 1\n' });

    await expect(fieldInFile(join(folder, 'cpu.stat'), 'usage_usec')).resolves.toBeNull();
    await expect(fieldInFile(join(folder, 'missing'), 'usage_usec')).resolves.toBeNull();
  });
});
