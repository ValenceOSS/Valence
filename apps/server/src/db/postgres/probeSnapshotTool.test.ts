import { describe, expect, it, vi } from 'vitest';
import { probeSnapshotTool } from './probeSnapshotTool';

describe('probeSnapshotTool', () => {
  it('asks pg_dump for its version', async () => {
    const run = vi.fn(() => Promise.resolve<'ran'>('ran'));

    expect(await probeSnapshotTool(run)).toBe('ran');
    expect(run).toHaveBeenCalledWith('pg_dump', ['--version']);
  });

  it('reads a tool that fails as missing', async () => {
    expect(await probeSnapshotTool(() => Promise.reject(new Error('broken')))).toBe('missing');
  });
});
