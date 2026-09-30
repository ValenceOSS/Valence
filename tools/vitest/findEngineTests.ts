import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const OPENS_A_DATABASE = /#dialect\/(aMigratedDatabase|aScratchDatabase|aPlayground)'/;

/**
 * Finds the test files under a folder that open a real database of their own, which are the ones
 * worth running again on every engine; the rest never reach a database and say the same on all.
 *
 * @param root - The package the tests belong to.
 * @param folder - The folder under it to look in.
 * @returns Each such file's path, relative to the package.
 */
const findEngineTests = (root: string, folder = 'src'): string[] =>
  readdirSync(join(root, folder), { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.test.ts'))
    .map((path) => join(root, folder, path))
    .filter((path) => OPENS_A_DATABASE.test(readFileSync(path, 'utf8')))
    .map((path) => relative(root, path))
    .toSorted();

export { findEngineTests };
