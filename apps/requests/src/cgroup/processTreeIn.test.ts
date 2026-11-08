import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { aFolderOf } from '@ValenceRequests/testing/aFolderOf';
import { processTreeIn } from './processTreeIn';

const aProcess = (pid: number, parent: number, name = 'node') => ({
  [`${pid.toString()}/stat`]: `${pid.toString()} (${name}) S ${parent.toString()} 1 1 0 -1`,
});

describe('processTreeIn', () => {
  it('finds a process and everything under it, however deep, and nothing else', async () => {
    const proc = await aFolderOf({
      ...aProcess(100, 1),
      ...aProcess(101, 100, 'camoufox-bin'),
      ...aProcess(102, 101, 'Isolated Web Co'),
      ...aProcess(200, 1, 'somebody else'),
      'self/stat': 'not a process',
    });

    expect((await processTreeIn(proc, 100))?.toSorted()).toEqual([100, 101, 102]);
  });

  it('says nothing where the process is not there, or there is no /proc', async () => {
    await expect(processTreeIn(await aFolderOf(aProcess(200, 1)), 100)).resolves.toBeNull();
    await expect(processTreeIn(join(tmpdir(), 'no-such-proc-here'), 100)).resolves.toBeNull();
  });
});
