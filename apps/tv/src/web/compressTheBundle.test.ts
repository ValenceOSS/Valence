import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { compressTheBundle } from '@ValenceTv/web/compressTheBundle';

let folder = '';

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), 'valence-tv-build-'));
  mkdirSync(join(folder, 'js'));
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

describe('compressTheBundle', () => {
  it('writes gzip and brotli copies of a script, however deep, that unpack to the script', () => {
    const script = 'const valence = 1;\n'.repeat(200);

    writeFileSync(join(folder, 'js', 'index.js'), script);

    compressTheBundle(folder);

    expect(gunzipSync(readFileSync(join(folder, 'js', 'index.js.gz'))).toString()).toBe(script);
    expect(brotliDecompressSync(readFileSync(join(folder, 'js', 'index.js.br'))).toString()).toBe(
      script,
    );
  });

  it('leaves a file too small to be worth it, and anything that is not text', () => {
    writeFileSync(join(folder, 'tiny.js'), 'x');
    writeFileSync(join(folder, 'orb.png'), Buffer.alloc(4096));

    expect(compressTheBundle(folder)).toEqual([]);
    expect(existsSync(join(folder, 'tiny.js.gz'))).toBe(false);
  });
});
