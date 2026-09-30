import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const FOLDERS = ['postgres', 'mysql'] as const;

const MODULE = z.looseObject({});

/**
 * Lists the files in a dialect folder that hold a member, leaving out tests and the helpers a
 * dialect keeps in folders of its own.
 *
 * @param folder - The dialect's folder.
 * @returns The files' names, sorted.
 */
const membersOf = (folder: string): string[] =>
  readdirSync(join(import.meta.dirname, folder), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => entry.name)
    .filter((name) => !name.endsWith('.test.ts'))
    .toSorted();

describe('the dialect folders', () => {
  it('hold the same members', () => {
    const [postgres, mysql] = FOLDERS.map(membersOf);

    expect(mysql).toEqual(postgres);
  });

  it.each(membersOf('postgres'))('export the same names from %s', async (file) => {
    const [postgres, mysql] = await Promise.all(
      FOLDERS.map(async (folder) =>
        Object.keys(MODULE.parse(await import(join(import.meta.dirname, folder, file)))).toSorted(),
      ),
    );

    expect(mysql).toEqual(postgres);
  });
});
