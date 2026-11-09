import { describe, expect, it } from 'vitest';
import { aFolderOf } from '@ValenceRequests/testing/aFolderOf';
import { containerHierarchyIn } from './containerHierarchyIn';

describe('containerHierarchyIn', () => {
  it('takes version two wherever the container’s memory is counted', async () => {
    await expect(
      containerHierarchyIn(await aFolderOf({ 'memory.current': '1000\n' })),
    ).resolves.toBe('unified');
  });

  it('takes version one only where a memory limit says it is a container', async () => {
    const limited = await aFolderOf({
      'memory/memory.usage_in_bytes': '900\n',
      'memory/memory.limit_in_bytes': '2000\n',
    });
    const machine = await aFolderOf({
      'memory/memory.usage_in_bytes': '900\n',
      'memory/memory.limit_in_bytes': '9223372036854771712\n',
    });

    await expect(containerHierarchyIn(limited)).resolves.toBe('legacy');
    await expect(containerHierarchyIn(machine)).resolves.toBeNull();
  });

  it('says nothing where there is no cgroup, or only the root of one', async () => {
    await expect(containerHierarchyIn(await aFolderOf({}))).resolves.toBeNull();
    await expect(
      containerHierarchyIn(await aFolderOf({ 'cpu.stat': 'usage_usec 99\n' })),
    ).resolves.toBeNull();
  });
});
