import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGLISH } from './ENGLISH';
import { problemsWithEnglish } from './problemsWithEnglish';
import { StringsFileSchema } from './StringsFileSchema';
import { wordsOf } from './wordsOf';

const english = StringsFileSchema.parse(
  JSON.parse(readFileSync(join(import.meta.dirname, '..', 'strings-en.json'), 'utf8')),
);

describe('ENGLISH', () => {
  it('holds the words of strings-en.json and nothing else, so pnpm i18n:write has been run', () => {
    expect(ENGLISH).toEqual(wordsOf(english));
  });

  it('comes from a strings file with no handler or text written twice, in handler order', () => {
    expect(problemsWithEnglish(english)).toEqual([]);
  });
});
