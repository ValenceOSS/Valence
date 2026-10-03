import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { build } from 'electron-vite';

let root = '';

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('the desktop main bundle', () => {
  it('keeps its code when a string ends in the word import', async () => {
    root = await mkdtemp(join(tmpdir(), 'valence-main-bundle-'));

    await writeFile(join(root, 'package.json'), JSON.stringify({ type: 'module' }));
    await writeFile(
      join(root, 'Main.ts'),
      [
        "const WORDS = { asked: 'Who to import', after: 'Something after it' };",
        "const { join: joined } = require('node:path');",
        'console.log(WORDS, joined);',
        '',
      ].join('\n'),
    );

    await writeFile(
      join(root, 'electron.vite.config.ts'),
      [
        'export default {',
        '  main: {',
        '    build: {',
        `      outDir: ${JSON.stringify(join(root, 'out'))},`,
        `      lib: { entry: ${JSON.stringify(join(root, 'Main.ts'))} },`,
        "      rolldownOptions: { output: { entryFileNames: 'Main.js' } },",
        '    },',
        '  },',
        '};',
        '',
      ].join('\n'),
    );

    await build({ root, configFile: join(root, 'electron.vite.config.ts'), logLevel: 'silent' });

    const built = await readFile(join(root, 'out', 'Main.js'), 'utf8');

    expect(built).toContain('Who to import');
    expect(built).toContain('Something after it');
    expect(built).toContain('CommonJS Shims');
  }, 60_000);
});
