import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES } from './LANGUAGES';
import { StringsFileSchema } from './StringsFileSchema';

const LOADERS_ID = 'virtual:valence-words';

const ONE_LANGUAGE = `${LOADERS_ID}/`;

const RESOLVED = '\0valence-words';

/**
 * Writes the module that loads a language's words when somebody chooses it, each language its own
 * chunk so nobody downloads the ones they do not speak.
 *
 * @returns The module's code.
 */
const loadersModule = (): string =>
  [
    'const LOADERS = {',
    ...LANGUAGES.filter((language) => language !== 'en').map(
      (language) => `  '${language}': () => import('${ONE_LANGUAGE}${language}'),`,
    ),
    '};',
    '',
    'export const loadWords = async (language) => {',
    '  const load = LOADERS[language];',
    '',
    '  return load === undefined ? {} : (await load()).default;',
    '};',
    '',
  ].join('\n');

/**
 * Writes the module holding one language's words by handler, without the notes left for its
 * translators, which nobody reading the app needs.
 *
 * @param folder - Where the strings files are.
 * @param language - The language.
 * @returns The module's code.
 */
const wordsModule = (folder: string, language: string): string => {
  const entries = StringsFileSchema.parse(
    JSON.parse(readFileSync(join(folder, `strings-${language}.json`), 'utf8')),
  );

  return `export default JSON.parse(${JSON.stringify(
    JSON.stringify(Object.fromEntries(entries.map((entry) => [entry.handler, entry.text]))),
  )});\n`;
};

/**
 * A build plugin that lets a web app speak any of Valence's languages: `virtual:valence-words`
 * exports `loadWords(language)`, which fetches that language's words, by handler, when it is asked
 * for.
 *
 * @returns The plugin.
 */
const wordsByLanguage = () => {
  const folder = join(import.meta.dirname, '..');

  return {
    name: 'valence-words-by-language',
    resolveId: (id: string) =>
      id === LOADERS_ID
        ? RESOLVED
        : id.startsWith(ONE_LANGUAGE)
          ? `${RESOLVED}/${id.slice(ONE_LANGUAGE.length)}`
          : null,
    load: (id: string) =>
      id === RESOLVED
        ? loadersModule()
        : id.startsWith(`${RESOLVED}/`)
          ? wordsModule(folder, id.slice(RESOLVED.length + 1))
          : null,
  };
};

export { wordsByLanguage };
