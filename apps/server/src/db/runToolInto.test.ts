import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { runToolInto } from './runToolInto';

const aFile = async (): Promise<string> =>
  join(await mkdtemp(join(tmpdir(), 'valence-into-')), 'out.gz');

describe('runToolInto', () => {
  it('gzips what the tool prints into the file', async () => {
    const file = await aFile();

    await expect(
      runToolInto({ command: 'sh', args: ['-c', 'printf "$SAID"'], env: { SAID: 'dumped' }, file }),
    ).resolves.toBe('ran');

    expect(gunzipSync(await readFile(file)).toString('utf8')).toBe('dumped');
  });

  it('answers that a tool is not installed, leaving no file', async () => {
    const file = await aFile();

    await expect(runToolInto({ command: 'valence-no-such-tool', args: [], file })).resolves.toBe(
      'missing',
    );
    await expect(stat(file)).rejects.toThrow();
  });

  it('fails with what the tool said, leaving no file', async () => {
    const file = await aFile();

    await expect(
      runToolInto({ command: 'sh', args: ['-c', 'echo partly; echo refused >&2; exit 2'], file }),
    ).rejects.toThrow('refused');
    await expect(stat(file)).rejects.toThrow();
  });

  it('says how it stopped where the tool said nothing', async () => {
    await expect(
      runToolInto({ command: 'sh', args: ['-c', 'exit 3'], file: await aFile() }),
    ).rejects.toThrow('sh stopped with 3');
  });
});
