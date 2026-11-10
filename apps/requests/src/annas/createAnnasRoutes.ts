import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { z } from 'zod';
import { importAnnasBooks } from '@ValenceRequests/annas/importAnnasBooks';
import { readBody } from '@ValenceRequests/readBody';
import type { AnnasBookStore } from '@ValenceRequests/annas/createDatabaseAnnasBookStore';
import type { AnnasTorrents } from '@ValenceRequests/annas/createAnnasTorrents';
import { refuse } from '@ValenceI18n/refuse';

const INDEX_FILE = /^aarecords__\d+\.json\.gz$/;

const SAYS_HOW_FAR_EVERY = 1_000_000;

const ImportSchema = z.object({
  folder: z.string().min(1),
  mirror: z.string().url(),
  languages: z.array(z.string().min(2).max(8)).min(1).max(20),
  formats: z.array(z.string().min(2).max(8)).min(1).max(20),
  threads: z.number().int().min(1).max(64).optional(),
});

type CreateAnnasRoutesOptions = {
  books: Pick<AnnasBookStore, 'keep' | 'count'>;
  torrents: Pick<AnnasTorrents, 'all'>;
  log: (line: string) => void;
};

/**
 * Lets whoever runs this service fill its copy of Anna's Archive's books from the index on disk —
 * once at a time, in the background, from a mirror's list of the torrents that are still offered —
 * and see how far it has got.
 *
 * @param books - Where the books are kept.
 * @param torrents - Anna's Archive's list of its torrents.
 * @param log - Where to say how far it has got.
 * @returns The routes.
 */
const createAnnasRoutes = ({ books, torrents, log }: CreateAnnasRoutesOptions) => {
  const routes = new Hono();
  let running: { read: number; kept: number; startedAt: string } | null = null;

  routes.get('/annas/import', async (context) =>
    context.json({ running, books: await books.count() }),
  );

  routes.post('/annas/import', async (context) => {
    const asked = await readBody(context.req.raw, ImportSchema);

    if (asked === null) {
      return context.json(refuse('error.requests.thatIsNotAnIndexToImport'), 400);
    }

    if (running !== null) {
      return context.json({ running }, 409);
    }

    const files = (await readdir(asked.folder).catch((): string[] => []))
      .filter((name) => INDEX_FILE.test(name))
      .toSorted()
      .map((name) => join(asked.folder, name));
    const keys = new Set((await torrents.all(new URL(asked.mirror).origin)).keys());

    if (files.length === 0 || keys.size === 0) {
      return context.json(refuse('error.requests.thatIsNotAnIndexToImport'), 400);
    }

    const progress = { read: 0, kept: 0, startedAt: new Date().toISOString() };

    running = progress;

    void importAnnasBooks({
      files,
      keep: books.keep,
      torrentKeys: keys,
      languages: new Set(asked.languages),
      formats: new Set(asked.formats),
      ...(asked.threads === undefined ? {} : { threads: asked.threads }),
      onProgress: (read, kept) => {
        const isNewMillion =
          Math.floor(read / SAYS_HOW_FAR_EVERY) > Math.floor(progress.read / SAYS_HOW_FAR_EVERY);

        progress.read = read;
        progress.kept = kept;

        if (isNewMillion) {
          log(`Anna's Archive: read ${read.toString()} records, kept ${kept.toString()} books.`);
        }
      },
      onNote: (note) => {
        log(`Anna's Archive: ${note}`);
      },
    })
      .then(({ read, kept, skipped, failedFiles }) => {
        log(
          `Anna's Archive: finished, ${kept.toString()} books kept of ${read.toString()} read, ${skipped.toString()} passed over, ${failedFiles.length.toString()} files unread.`,
        );
      })
      .catch((error: Error) => {
        log(`Anna's Archive: the import stopped: ${error.message}`);
      })
      .finally(() => {
        running = null;
      });

    return context.json({ running: progress, files: files.length }, 202);
  });

  return routes;
};

export { createAnnasRoutes };
