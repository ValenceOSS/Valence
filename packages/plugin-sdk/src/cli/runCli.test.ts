import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { aPluginFolder } from '@ValenceSDK/testing/aPluginFolder';
import { runCli } from './runCli';
import { USAGE } from './USAGE';

const listen = () => {
  const said: string[] = [];
  const complained: string[] = [];

  return {
    said,
    complained,
    output: {
      say: (line: string) => said.push(line),
      complain: (line: string) => complained.push(line),
    },
  };
};

const privateKey = () =>
  generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

describe('runCli', () => {
  const started = process.cwd();

  afterEach(() => {
    process.chdir(started);
  });

  it('packs the current folder into dist when told nothing else', () => {
    const folder = aPluginFolder();
    const heard = listen();

    process.chdir(folder);

    expect(runCli(['pack'], {}, heard.output)).toBe(0);
    expect(existsSync(join(folder, 'dist', 'anime-tracker-1.2.0.vplugin'))).toBe(true);
  });

  it('writes keys to keys and a catalogue to site when told nothing else', () => {
    const folder = aPluginFolder();

    process.chdir(folder);
    runCli(['pack', '.', '--out', 'packages'], {}, listen().output);

    expect(runCli(['keygen', 'mine'], {}, listen().output)).toBe(0);
    expect(existsSync(join(folder, 'keys', 'mine.pem'))).toBe(true);
    expect(
      runCli(
        [
          'catalogue',
          'packages',
          '--key-id',
          'k',
          '--package-url',
          'https://x.test/{file}',
          '--source-url',
          'https://x.test/{id}',
          '--icon-url',
          'https://x.test/{file}',
          '--key',
          join(folder, 'keys', 'mine.pem'),
        ],
        {},
        listen().output,
      ),
    ).toBe(0);
    expect(existsSync(join(folder, 'site', 'catalogue.json'))).toBe(true);
  });

  it('packs a folder', () => {
    const out = mkdtempSync(join(tmpdir(), 'valence-cli-'));
    const heard = listen();

    expect(runCli(['pack', aPluginFolder(), '--out', out], {}, heard.output)).toBe(0);
    expect(heard.said).toEqual([`Packed ${join(out, 'anime-tracker-1.2.0.vplugin')}`]);
  });

  it('signs with the key from the environment, or from --key', () => {
    const folder = mkdtempSync(join(tmpdir(), 'valence-cli-'));
    const file = join(folder, 'a.vplugin');
    const keyFile = join(folder, 'key.pem');

    writeFileSync(file, 'bytes');
    writeFileSync(keyFile, privateKey());

    expect(
      runCli(['sign', file], { VALENCE_PLUGIN_SIGNING_KEY: privateKey() }, listen().output),
    ).toBe(0);
    expect(runCli(['sign', file, '--key', keyFile], {}, listen().output)).toBe(0);
    expect(existsSync(`${file}.sig`)).toBe(true);
  });

  it('refuses to sign with no key, saying how to give one', () => {
    const heard = listen();

    expect(runCli(['sign', 'a.vplugin'], { VALENCE_PLUGIN_SIGNING_KEY: ' ' }, heard.output)).toBe(
      1,
    );
    expect(heard.complained).toEqual([
      'No signing key: pass --key or set VALENCE_PLUGIN_SIGNING_KEY.',
    ]);
  });

  it('makes a key pair', () => {
    const heard = listen();

    expect(
      runCli(
        ['keygen', 'mine', '--out', mkdtempSync(join(tmpdir(), 'valence-cli-'))],
        {},
        heard.output,
      ),
    ).toBe(0);
    expect(heard.said).toHaveLength(2);
  });

  it('builds a catalogue', () => {
    const packages = mkdtempSync(join(tmpdir(), 'valence-cli-'));
    const heard = listen();

    runCli(['pack', aPluginFolder(), '--out', packages], {}, listen().output);

    expect(
      runCli(
        [
          'catalogue',
          packages,
          '--key-id',
          'k',
          '--package-url',
          'https://x.test/{file}',
          '--source-url',
          'https://x.test/{id}',
          '--icon-url',
          'https://x.test/icons/{file}',
          '--out',
          mkdtempSync(join(tmpdir(), 'valence-cli-')),
        ],
        { VALENCE_PLUGIN_SIGNING_KEY: privateKey() },
        heard.output,
        new Date('2026-09-28T12:00:00.000Z'),
      ),
    ).toBe(0);
    expect(heard.said).toEqual(['Catalogue of 1 plugins written']);
  });

  it('shows how it is used when a command is unknown or incomplete', () => {
    for (const words of [[], ['launch'], ['sign'], ['keygen'], ['catalogue', 'packages']]) {
      const heard = listen();

      expect(runCli(words, {}, heard.output)).toBe(1);
      expect(heard.complained).toEqual([USAGE]);
    }
  });

  it('says what went wrong when packing fails', () => {
    const heard = listen();

    expect(runCli(['pack', mkdtempSync(join(tmpdir(), 'valence-empty-'))], {}, heard.output)).toBe(
      1,
    );
    expect(heard.complained[0]).toContain('manifest.json');
  });
});
