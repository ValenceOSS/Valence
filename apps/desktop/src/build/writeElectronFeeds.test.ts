import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    ['--import', 'tsx', join(import.meta.dirname, 'writeElectronFeeds.ts'), ...args],
    { cwd: DESKTOP, encoding: 'utf8' },
  );

/**
 * Puts files in the folder the script reads.
 *
 * @param files - Each file's name and what it holds.
 */
const holding = (files: Record<string, string>) => {
  for (const [name, text] of Object.entries(files)) {
    writeFileSync(join(folder, name), text);
  }
};

/**
 * What the feed called `name` says.
 *
 * @param name - The feed's file name.
 */
const feed = (name: string) => readFileSync(join(folder, name), 'utf8');

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), 'valence-electron-feeds-'));
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

describe('writeElectronFeeds', () => {
  it("writes each system's feed beside the files it offers", () => {
    holding({
      'Valence-Setup-1.5.0-x64.exe': 'windows',
      'Valence-Setup-1.5.0-arm64.exe': 'windows on arm',
      'Valence-1.5.0-arm64-mac.zip': 'mac',
      'Valence-1.5.0-arm64.dmg': 'disk image',
      'Valence-1.5.0-x86_64.AppImage': 'linux',
      'Valence-1.5.0-arm64.AppImage': 'linux on arm',
      'Valence-1.5.0-amd64.deb': 'debian',
    });

    const ran = run('--folder', folder, '--version', 'v1.5.0');

    expect(ran.status).toBe(0);
    expect(feed('latest.yml')).toContain('  - url: "Valence-Setup-1.5.0-x64.exe"\n');
    expect(feed('latest.yml')).toContain('  - url: "Valence-Setup-1.5.0-arm64.exe"\n');
    expect(feed('latest.yml')).toContain(
      `    sha512: "${createHash('sha512').update('windows').digest('base64')}"\n    size: 7\n`,
    );
    expect(feed('latest-mac.yml')).toContain('url: "Valence-1.5.0-arm64-mac.zip"');
    expect(feed('latest-mac.yml')).not.toContain('dmg');
    expect(feed('latest-linux.yml')).toContain('path: "Valence-1.5.0-x86_64.AppImage"');
    expect(feed('latest-linux-arm64.yml')).toContain('path: "Valence-1.5.0-arm64.AppImage"');
    expect(feed('latest.yml').startsWith('version: "1.5.0"\n')).toBe(true);
  });

  it("writes the dev channel's feeds where it is told to", () => {
    holding({ 'Valence-Setup-1.5.0-dev.12-x64.exe': 'windows' });

    const out = mkdtempSync(join(tmpdir(), 'valence-electron-feeds-out-'));
    const ran = run('--folder', folder, '--version', '1.5.0-dev.12', '--dev', '--out', out);

    expect(ran.status).toBe(0);
    expect(readFileSync(join(out, 'dev.yml'), 'utf8')).toContain('version: "1.5.0-dev.12"');
    expect(existsSync(join(out, 'latest.yml'))).toBe(false);

    rmSync(out, { recursive: true, force: true });
  });

  it('refuses a folder with nothing the Electron app could update to', () => {
    holding({ 'Valence-1.5.0-arm64.dmg': '' });

    expect(run('--folder', folder, '--version', '1.5.0').status).toBe(1);
  });

  it('refuses to guess which version it is', () => {
    holding({ 'Valence-Setup-1.5.0-x64.exe': '' });

    expect(run('--folder', folder).status).toBe(1);
  });
});
