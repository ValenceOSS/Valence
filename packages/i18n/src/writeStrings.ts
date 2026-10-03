import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { alignTranslation } from '@ValenceI18n/alignTranslation';
import { englishModuleOf } from '@ValenceI18n/englishModuleOf';
import { LANGUAGES } from '@ValenceI18n/LANGUAGES';
import { sortStrings } from '@ValenceI18n/sortStrings';
import { StringsFileSchema } from '@ValenceI18n/StringsFileSchema';
import type { StringEntry } from '@ValenceI18n/StringsFileSchema';
import { wordsOf } from '@ValenceI18n/wordsOf';

const PACKAGE = join(import.meta.dirname, '..');

/**
 * Reads one language's strings file, or nothing for a language that has none yet.
 *
 * @param path - Where the file is.
 */
const readStrings = (path: string): StringEntry[] =>
  existsSync(path) ? StringsFileSchema.parse(JSON.parse(readFileSync(path, 'utf8'))) : [];

const englishPath = join(PACKAGE, 'strings-en.json');
const english = sortStrings(readStrings(englishPath));
const written: string[] = [englishPath];

writeFileSync(englishPath, JSON.stringify(english));

for (const language of LANGUAGES.filter((tag) => tag !== 'en')) {
  const path = join(PACKAGE, `strings-${language}.json`);

  writeFileSync(path, JSON.stringify(alignTranslation(english, readStrings(path))));
  written.push(path);
}

const englishModule = join(PACKAGE, 'src', 'ENGLISH.ts');

writeFileSync(englishModule, englishModuleOf(wordsOf(english)));
written.push(englishModule);

execFileSync('oxfmt', written, { stdio: 'inherit' });
