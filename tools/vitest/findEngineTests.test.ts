import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findEngineTests } from './findEngineTests';

/**
 * Lays out a package with some test files in it.
 *
 * @param files - Each file's path under the package, and what it holds.
 * @returns Where the package is.
 */
const aPackage = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), 'engine-tests-'));

  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  }

  return root;
};

describe('findEngineTests', () => {
  it('finds the tests that open a database of their own, however deep', () => {
    const root = aPackage({
      'src/jobs/queue.test.ts': "import { aMigratedDatabase } from '#dialect/aMigratedDatabase';",
      'src/db/stores/one.test.ts': "import { aScratchDatabase } from '#dialect/aScratchDatabase';",
      'src/upsert.test.ts': "import { aPlayground } from '#dialect/aPlayground';",
    });

    expect(findEngineTests(root)).toEqual([
      join('src', 'db', 'stores', 'one.test.ts'),
      join('src', 'jobs', 'queue.test.ts'),
      join('src', 'upsert.test.ts'),
    ]);
  });

  it('leaves out tests that never reach a database, and files that are not tests', () => {
    const root = aPackage({
      'src/pure.test.ts': "import { describe } from 'vitest';",
      'src/aMigratedDatabase.ts': "import { x } from '#dialect/aMigratedDatabase';",
    });

    expect(findEngineTests(root)).toEqual([]);
  });
});
