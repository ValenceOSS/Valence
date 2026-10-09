import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const COMPRESSIBLE = new Set(['.js', '.css', '.html', '.json', '.svg', '.map']);

const SMALLEST = 1024;

/**
 * Lists every file under a folder, however deep.
 *
 * @param directory - Where to look.
 * @returns Each file's path.
 */
const everyFileIn = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? everyFileIn(join(directory, entry.name)) : [join(directory, entry.name)],
  );

/**
 * Writes a gzip and a brotli copy beside every text file in the television's web build, for the
 * server to send in place of the file to a browser that can take one.
 *
 * The bundle is several megabytes of script, and a television on a home network downloads all of
 * it before it can draw anything; compressed, it is about a fifth of that. Compressing once here
 * costs nothing when it is served, where compressing on every request would cost the server each
 * time. A file too small to be worth it is left alone.
 *
 * @param directory - The build's folder.
 * @returns The copies written.
 */
const compressTheBundle = (directory: string): string[] =>
  everyFileIn(directory)
    .filter((path) => COMPRESSIBLE.has(extname(path)) && statSync(path).size >= SMALLEST)
    .flatMap((path) => {
      const whole = readFileSync(path);

      writeFileSync(`${path}.gz`, gzipSync(whole, { level: 9 }));
      writeFileSync(
        `${path}.br`,
        brotliCompressSync(whole, {
          params: {
            [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
            [constants.BROTLI_PARAM_SIZE_HINT]: whole.length,
          },
        }),
      );

      return [`${path}.gz`, `${path}.br`];
    });

export { compressTheBundle };
