import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANGUAGES } from './LANGUAGES';
import { problemsWithTranslation } from './problemsWithTranslation';
import { StringsFileSchema } from './StringsFileSchema';

const stringsOf = (language: string) =>
  StringsFileSchema.parse(
    JSON.parse(readFileSync(join(import.meta.dirname, '..', `strings-${language}.json`), 'utf8')),
  );

describe('LANGUAGES', () => {
  it.each(LANGUAGES.filter((language) => language !== 'en'))(
    'has a %s strings file in step with the English',
    (language) => {
      expect(problemsWithTranslation(stringsOf('en'), stringsOf(language))).toEqual([]);
    },
  );
});
