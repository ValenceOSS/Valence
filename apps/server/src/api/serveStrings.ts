import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isLanguage } from '@ValenceI18n/isLanguage';
import { refuse } from '@ValenceI18n/refuse';
import { StringsFileSchema } from '@ValenceI18n/StringsFileSchema';
import { wordsInFile } from '@ValenceI18n/wordsInFile';
import { readStringsRoute } from '@ValenceServer/routes/StringsRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

type Served = { words: Record<string, string>; tag: string };

/**
 * Serves each language's words to the apps that cannot carry every language with them, the phone
 * and the television, so they speak whatever this server has been translated into. Each language
 * is read once and kept, and answered with a tag, so an app that already holds the words is told
 * so rather than sent them again. Nobody needs to be signed in: the words are the same for
 * everybody, and an app needs them before anybody has signed in.
 *
 * @param app - The application.
 * @param context - What the routes share, among it where the strings files are.
 */
const serveStrings = (app: OpenAPIHono, context: Pick<AppContext, 'stringsFolder'>): void => {
  const { stringsFolder } = context;
  const kept = new Map<string, Promise<Served>>();

  const read = (language: string, folder: string): Promise<Served> => {
    const held = kept.get(language);

    if (held !== undefined) {
      return held;
    }

    const reading = readFile(join(folder, `strings-${language}.json`), 'utf8').then((text) => {
      const words = wordsInFile(StringsFileSchema.parse(JSON.parse(text)));

      return {
        words,
        tag: `"${createHash('sha256').update(JSON.stringify(words)).digest('base64url').slice(0, 27)}"`,
      };
    });

    kept.set(language, reading);
    reading.catch(() => kept.delete(language));

    return reading;
  };

  app.openapi(readStringsRoute, async (asked) => {
    const { language } = asked.req.valid('param');

    if (stringsFolder === null || !isLanguage(language)) {
      return asked.json(refuse('common.notFound'), 404);
    }

    const served = await read(language, stringsFolder);

    asked.header('ETag', served.tag);
    asked.header('Cache-Control', 'public, max-age=3600, must-revalidate');

    if (asked.req.header('If-None-Match') === served.tag) {
      return asked.body(null, 304);
    }

    return asked.json(served.words, 200);
  });
};

export { serveStrings };
