import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, sep } from 'node:path';

const OPENS_A_DATABASE = /#dialect\/(aMigratedDatabase|aScratchDatabase|aPlayground)'/;

/**
 * Finds the test files under a folder that open a real database, or that test the mysql dialect
 * itself, which are the ones worth running again on every engine; the rest never reach a database
 * and say the same on all. A test that opens one through a test helper counts as well as one that
 * opens it directly, so a helper such as a seeded household brings its tests along.
 *
 * @param root - The package the tests belong to.
 * @param folder - The folder under it to look in.
 * @returns Each such file's path, relative to the package.
 */
const findEngineTests = (root: string, folder = 'src'): string[] => {
  const files = readdirSync(join(root, folder), { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.ts'))
    .map((path) => join(folder, path));
  const textOf = (path: string): string => readFileSync(join(root, path), 'utf8');
  const helpers = files
    .filter((path) => !path.endsWith('.test.ts') && OPENS_A_DATABASE.test(textOf(path)))
    .map((path) => basename(path, '.ts'))
    .filter((name) => !['aMigratedDatabase', 'aScratchDatabase', 'aPlayground'].includes(name));
  const throughAHelper = new RegExp(`/(${helpers.join('|')})'`);

  return files
    .filter((path) => path.endsWith('.test.ts'))
    .filter((path) => {
      const text = textOf(path);

      return (
        path.split(sep).includes('mysql') ||
        OPENS_A_DATABASE.test(text) ||
        (helpers.length > 0 && throughAHelper.test(text))
      );
    })
    .toSorted();
};

export { findEngineTests };
