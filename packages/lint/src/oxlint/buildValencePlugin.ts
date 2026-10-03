import { join } from 'node:path';
import { build } from 'esbuild';

const OUT = join(import.meta.dirname, '..', '..', 'dist', 'valence-oxlint.js');

/**
 * Bundles Valence's own lint rules into the one file oxlint loads, since oxlint reads a plugin with
 * Node's own TypeScript support, which cannot follow imports written without their extension.
 *
 * @param outfile - Where to write the bundle.
 * @returns Where it was written.
 */
const buildValencePlugin = async (outfile = OUT): Promise<string> => {
  await build({
    stdin: {
      contents: "export { valencePlugin as default } from './valencePlugin';",
      resolveDir: import.meta.dirname,
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    outfile,
    logLevel: 'warning',
  });

  return outfile;
};

if (process.argv[1] === import.meta.filename) {
  await buildValencePlugin();
}

export { buildValencePlugin };
