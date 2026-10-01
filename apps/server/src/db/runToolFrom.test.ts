import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { runToolFrom } from './runToolFrom';

const aFolder = (): Promise<string> => mkdtemp(join(tmpdir(), 'valence-from-'));

describe('runToolFrom', () => {
  it('unpacks the file into what the tool reads', async () => {
    const folder = await aFolder();
    const file = join(folder, 'in.gz');
    const out = join(folder, 'out');

    await writeFile(file, gzipSync('restored'));

    await expect(
      runToolFrom({ command: 'sh', args: ['-c', 'cat > "$OUT"'], env: { OUT: out }, file }),
    ).resolves.toBe('ran');

    expect(await readFile(out, 'utf8')).toBe('restored');
  });

  it('answers that a tool is not installed', async () => {
    const file = join(await aFolder(), 'in.gz');

    await writeFile(file, gzipSync(''));

    await expect(runToolFrom({ command: 'valence-no-such-tool', args: [], file })).resolves.toBe(
      'missing',
    );
  });

  it('fails with what the tool said', async () => {
    const file = join(await aFolder(), 'in.gz');

    await writeFile(file, gzipSync('drop everything'));

    await expect(
      runToolFrom({
        command: 'sh',
        args: ['-c', 'cat > /dev/null; echo refused >&2; exit 1'],
        file,
      }),
    ).rejects.toThrow('refused');
  });

  it('says how it stopped where the tool said nothing', async () => {
    const file = join(await aFolder(), 'in.gz');

    await writeFile(file, gzipSync(''));

    await expect(runToolFrom({ command: 'sh', args: ['-c', 'exit 4'], file })).rejects.toThrow(
      'sh stopped with 4',
    );
  });
});
