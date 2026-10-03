import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { theUpdateLog } from './theUpdateLog';

describe('theUpdateLog', () => {
  let folder = '';

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'valence-updates-'));
  });

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it('writes each line down, in the order it was said', async () => {
    const log = theUpdateLog(folder);

    log('Found 1.2.0');
    log('Asked to download 1.2.0');

    await vi.waitFor(
      async () => {
        const written = await readFile(join(folder, 'updates.log'), 'utf8');

        expect(written.split('\n').filter(Boolean)).toHaveLength(2);
      },
      { timeout: 5_000 },
    );

    const lines = (await readFile(join(folder, 'updates.log'), 'utf8')).split('\n');

    expect(lines[0]).toMatch(/^\d{4}-\d{2}-\d{2}T.+ Found 1\.2\.0$/u);
    expect(lines[1]).toMatch(/ Asked to download 1\.2\.0$/u);
  });

  it('drops a line it cannot write rather than failing', async () => {
    const log = theUpdateLog(join(folder, 'not', 'there'));

    expect(() => {
      log('Found 1.2.0');
    }).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});
