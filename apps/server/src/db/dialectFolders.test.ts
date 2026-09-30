import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Lists the members a dialect folder offers: its own files, leaving out tests and the helpers it
 * keeps in folders beneath it.
 *
 * @param dialect - The folder's name.
 * @returns The file names, in order.
 */
const membersOf = (dialect: string): string[] =>
  readdirSync(join(import.meta.dirname, dialect), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => entry.name)
    .filter((name) => !name.endsWith('.test.ts'))
    .toSorted();

describe('the dialect folders', () => {
  it('offer the same members, so #dialect finds each of them in either', () => {
    expect(membersOf('mysql')).toStrictEqual(membersOf('postgres'));
  });

  it('hold something to compare', () => {
    expect(membersOf('postgres')).toContain('Schema.ts');
  });
});
