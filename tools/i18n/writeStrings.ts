import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { alignTranslation } from '@ValenceI18n/alignTranslation';
import { englishModuleOf } from '@ValenceI18n/englishModuleOf';
import { LANGUAGES } from '@ValenceI18n/LANGUAGES';
import { sortStrings } from '@ValenceI18n/sortStrings';
import { StringsFileSchema } from '@ValenceI18n/StringsFileSchema';
import type { StringEntry } from '@ValenceI18n/StringsFileSchema';
import { wordsOf } from '@ValenceI18n/wordsOf';

const PACKAGE = join(import.meta.dirname, '..', '..', 'packages', 'i18n');

/**
 * Reads one language's strings file, or nothing for a language that has none yet.
 *
 * @param path - Where the file is.
 */
const readStrings = (path: string): StringEntry[] =>
  existsSync(path) ? StringsFileSchema.parse(JSON.parse(readFileSync(path, 'utf8'))) : [];

/**
 * Writes a file as Prettier would leave it, so a run of this script never shows up as formatting.
 *
 * @param path - Where the file goes.
 * @param source - What goes in it.
 * @param parser - How Prettier reads it.
 */
const writeFormatted = async (path: string, source: string, parser: string): Promise<void> => {
  const options = await resolveConfig(path);

  writeFileSync(path, await format(source, { ...options, parser }));
};

const englishPath = join(PACKAGE, 'strings-en.json');
const english = sortStrings(readStrings(englishPath));

await writeFormatted(englishPath, JSON.stringify(english), 'json');

for (const language of LANGUAGES.filter((tag) => tag !== 'en')) {
  const path = join(PACKAGE, `strings-${language}.json`);

  await writeFormatted(path, JSON.stringify(alignTranslation(english, readStrings(path))), 'json');
}

await writeFormatted(
  join(PACKAGE, 'src', 'ENGLISH.ts'),
  englishModuleOf(wordsOf(english)),
  'typescript',
);
