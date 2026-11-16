import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    ['--import', 'tsx', join(import.meta.dirname, 'writeUpdateManifest.ts'), ...args],
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

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), 'valence-update-manifest-'));
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

describe('writeUpdateManifest', () => {
  it("writes a release's manifest beside its bundles", () => {
    holding({
      'Valence-1.4.0-arm64.dmg': '',
      'Valence-1.4.0-arm64.app.tar.gz': '',
      'Valence-1.4.0-arm64.app.tar.gz.sig': 'bWFj\n',
      'Valence-1.4.0-x86_64.AppImage': '',
      'Valence-1.4.0-x86_64.AppImage.sig': 'bGludXg=',
    });

    const ran = run(
      '--folder',
      folder,
      '--version',
      'v1.4.0',
      '--tag',
      'v1.4.0',
      '--repository',
      'ValenceOSS/Valence',
    );

    expect(ran.status).toBe(0);
    expect(JSON.parse(readFileSync(join(folder, 'latest.json'), 'utf8'))).toMatchObject({
      version: '1.4.0',
      notes: 'https://github.com/ValenceOSS/Valence/releases/tag/v1.4.0',
      platforms: {
        'darwin-aarch64': {
          signature: 'bWFj',
          url: 'https://github.com/ValenceOSS/Valence/releases/download/v1.4.0/Valence-1.4.0-arm64.app.tar.gz',
        },
        'linux-x86_64-appimage': {
          signature: 'bGludXg=',
          url: 'https://github.com/ValenceOSS/Valence/releases/download/v1.4.0/Valence-1.4.0-x86_64.AppImage',
        },
      },
    });
  });

  it("points a dev build at the dev channel's release", () => {
    holding({
      'Valence-Setup-1.4.0-dev.12-x64.exe': '',
      'Valence-Setup-1.4.0-dev.12-x64.exe.sig': 'd2lu',
    });

    const out = join(folder, 'manifest.json');
    const ran = run(
      '--folder',
      folder,
      '--version',
      '1.4.0-dev.12',
      '--dev',
      '--repository',
      'ValenceOSS/Valence',
      '--out',
      out,
    );

    expect(ran.status).toBe(0);
    expect(JSON.parse(readFileSync(out, 'utf8'))).toMatchObject({
      version: '1.4.0-dev.12',
      platforms: {
        'windows-x86_64': {
          url: 'https://github.com/ValenceOSS/Valence/releases/download/desktop-dev/Valence-Setup-1.4.0-dev.12-x64.exe',
        },
      },
    });
  });

  it('refuses a bundle built without its signature', () => {
    holding({ 'Valence-1.4.0-x86_64.AppImage': '' });

    const ran = run('--folder', folder, '--version', '1.4.0', '--tag', 'v1.4.0');

    expect(ran.status).toBe(1);
    expect(ran.stderr).toContain('Valence-1.4.0-x86_64.AppImage');
  });

  it('refuses a folder with nothing an updater takes', () => {
    holding({ 'Valence-1.4.0-arm64.dmg': '' });

    expect(run('--folder', folder, '--version', '1.4.0', '--tag', 'v1.4.0').status).toBe(1);
  });

  it('refuses to guess which release it is for', () => {
    expect(run('--folder', folder, '--version', '1.4.0').status).toBe(1);
  });
});
