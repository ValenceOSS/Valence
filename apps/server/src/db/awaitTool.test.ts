import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { awaitTool } from './awaitTool';

describe('awaitTool', () => {
  it('says it ran where the tool finished well', async () => {
    await expect(awaitTool(spawn('sh', ['-c', 'exit 0']), 'sh')).resolves.toBe('ran');
  });

  it('says it is missing where the tool is not installed', async () => {
    await expect(awaitTool(spawn('valence-no-such-tool'), 'valence-no-such-tool')).resolves.toBe(
      'missing',
    );
  });

  it('fails with what the tool said', async () => {
    await expect(awaitTool(spawn('sh', ['-c', 'echo refused >&2; exit 1']), 'sh')).rejects.toThrow(
      'refused',
    );
  });

  it('says how it stopped where the tool said nothing', async () => {
    await expect(awaitTool(spawn('sh', ['-c', 'exit 5']), 'sh')).rejects.toThrow(
      'sh stopped with 5',
    );
  });

  it('fails where the tool could not be started for another reason', async () => {
    await expect(awaitTool(spawn(tmpdir()), tmpdir())).rejects.toThrow();
  });
});
