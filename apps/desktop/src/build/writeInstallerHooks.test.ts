import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const DESKTOP = join(import.meta.dirname, '..', '..');

let folder = '';

/**
 * Runs the script the way CI does, from the desktop app's folder.
 *
 * @param args - What it is run with.
 */
const run = (...args: string[]) =>
  spawnSync(
    process.execPath,
    ['--import', 'tsx', join(import.meta.dirname, 'writeInstallerHooks.ts'), ...args],
    { cwd: DESKTOP, encoding: 'utf8' },
  );

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), 'valence-installer-hooks-'));
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

describe('writeInstallerHooks', () => {
  it("writes the hooks for the Electron app's install", () => {
    const out = join(folder, 'hooks.nsh');

    expect(run('--out', out).status).toBe(0);
    expect(readFileSync(out, 'utf8')).toContain('Software\\54c29a86-3126-5144-b248-6bb15fc8a995');
  });

  it('refuses to guess where to write them', () => {
    expect(run().status).toBe(1);
  });
});
