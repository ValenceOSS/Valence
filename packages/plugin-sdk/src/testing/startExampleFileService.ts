import { randomBytes } from 'node:crypto';
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { z } from 'zod';

type ExampleEntry = {
  infoHash: string;
  name: string;
  tmdbId?: string;
  imdbId?: string;
  files: { name: string; path: string }[];
  isReady: boolean;
  prepareSeconds?: number;
  failure?: 'limitReached' | 'archive' | 'tooBig';
};

type ExampleItem = {
  id: string;
  entry: ExampleEntry | null;
  addedAt: number;
};

type StartExampleFileServiceOptions = {
  entries: readonly ExampleEntry[];
  key: string;
  port?: number;
  host?: string;
  publicOrigin?: string;
  linkSeconds?: number;
  now?: () => number;
};

type ExampleFileService = {
  origin: string;
  server: Server;
  stop: () => Promise<void>;
};

const RANGE = /^bytes=(\d*)-(\d*)$/;

const AskedSchema = z.looseObject({
  infoHash: z.string().optional(),
  fileName: z.string().optional(),
  hashes: z.array(z.string()).optional(),
});

/**
 * Starts a stand-in for a remote file service, speaking a small API made up for Valence's tests and
 * for trying a download client or a source by hand: it takes downloads by info hash and prepares
 * them over a few seconds, says which of a list of hashes it has ready, lists what it holds for a
 * film, and hands out links to its files that expire, served with ranges as a real service would.
 * What it holds is a list of files on this machine. It answers plain HTTP; Valence reaches it
 * through `VALENCE_DEV_HOSTS`.
 *
 * @param options - What it holds, the key it accepts, and where it listens.
 * @returns Where it is, and how to stop it.
 */
const startExampleFileService = async ({
  entries,
  key,
  port = 0,
  host = '127.0.0.1',
  publicOrigin,
  linkSeconds = 3 * 60 * 60,
  now = Date.now,
}: StartExampleFileServiceOptions): Promise<ExampleFileService> => {
  const items = new Map<string, ExampleItem>();
  const links = new Map<string, { path: string; expiresAt: number }>();
  const byHash = new Map(entries.map((entry) => [entry.infoHash, entry]));

  let origin = '';

  const send = (answer: ServerResponse, status: number, body: object | null): void => {
    answer.writeHead(status, { 'content-type': 'application/json' });
    answer.end(body === null ? undefined : JSON.stringify(body));
  };

  const readJson = async (asked: IncomingMessage): Promise<z.infer<typeof AskedSchema>> => {
    const parts: Buffer[] = [];

    for await (const chunk of asked) {
      parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }

    return AskedSchema.parse(JSON.parse(Buffer.concat(parts).toString('utf8') || '{}'));
  };

  const progressOf = (item: ExampleItem): number => {
    if (item.entry === null || item.entry.isReady) {
      return 1;
    }

    const seconds = item.entry.prepareSeconds ?? 5;

    return Math.min(1, (now() - item.addedAt) / 1000 / seconds);
  };

  const sizeOf = (entry: ExampleEntry): number =>
    entry.files.reduce((total, file) => total + statSync(file.path).size, 0);

  const linkTo = (file: { name: string; path: string }): string => {
    const token = randomBytes(12).toString('hex');

    links.set(token, { path: file.path, expiresAt: now() + linkSeconds * 1000 });

    return `${publicOrigin ?? origin}/f/${token}/${encodeURIComponent(file.name.split('/').pop() ?? '')}`;
  };

  const serveFile = (asked: IncomingMessage, answer: ServerResponse, token: string): void => {
    const link = links.get(token);

    if (link === undefined || link.expiresAt <= now()) {
      send(answer, 410, { error: 'expired' });

      return;
    }

    const size = statSync(link.path).size;
    const range = RANGE.exec(asked.headers.range ?? '');

    if (range === null) {
      answer.writeHead(200, { 'content-length': size, 'accept-ranges': 'bytes' });
      createReadStream(link.path).pipe(answer);

      return;
    }

    const start = range[1] === '' ? Math.max(0, size - Number(range[2])) : Number(range[1]);
    const end =
      range[1] === '' || range[2] === '' ? size - 1 : Math.min(Number(range[2]), size - 1);

    if (start > end || start >= size) {
      answer.writeHead(416, { 'content-range': `bytes */${size.toString()}` });
      answer.end();

      return;
    }

    answer.writeHead(206, {
      'content-length': end - start + 1,
      'content-range': `bytes ${start.toString()}-${end.toString()}/${size.toString()}`,
      'accept-ranges': 'bytes',
    });
    createReadStream(link.path, { start, end }).pipe(answer);
  };

  const route = async (asked: IncomingMessage, answer: ServerResponse): Promise<void> => {
    const url = new URL(asked.url ?? '/', 'http://stand-in');
    const parts = url.pathname.split('/').filter((part) => part !== '');

    if (parts[0] === 'f' && parts[1] !== undefined && asked.method === 'GET') {
      serveFile(asked, answer, parts[1]);

      return;
    }

    if (asked.headers.authorization !== `Bearer ${key}`) {
      send(answer, 401, { error: 'notSetUp' });

      return;
    }

    if (url.pathname === '/v1/account') {
      send(answer, 200, { plan: 'example', version: '1.0' });

      return;
    }

    if (url.pathname === '/v1/items' && asked.method === 'POST') {
      const body = await readJson(asked);
      const hash = body.infoHash?.toLowerCase() ?? '';
      const entry = byHash.get(hash) ?? null;

      if (entry?.failure !== undefined) {
        send(answer, 409, { error: entry.failure });

        return;
      }

      const id = (items.size + 1).toString();

      items.set(id, { id, entry, addedAt: now() });
      send(answer, 201, { id });

      return;
    }

    if (url.pathname === '/v1/items' && asked.method === 'GET') {
      const ids = (url.searchParams.get('ids') ?? '').split(',');

      send(answer, 200, {
        items: ids.flatMap((id) => {
          const item = items.get(id);

          if (item === undefined) {
            return [];
          }

          const progress = progressOf(item);
          const size = item.entry === null ? 0 : sizeOf(item.entry);

          return [
            {
              id,
              state: item.entry === null ? 'failed' : progress >= 1 ? 'done' : 'downloading',
              progress: item.entry === null ? 0 : progress,
              sizeBytes: size,
              doneBytes: Math.round(size * progress),
              error: item.entry === null ? 'unavailable' : null,
            },
          ];
        }),
      });

      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'items' && parts[2] !== undefined) {
      const item = items.get(parts[2]);

      if (item === undefined) {
        send(answer, 404, { error: 'unavailable' });

        return;
      }

      if (asked.method === 'DELETE') {
        items.delete(item.id);
        send(answer, 204, null);

        return;
      }

      if (parts[3] === 'files' && item.entry !== null && progressOf(item) >= 1) {
        send(answer, 200, {
          files: item.entry.files.map((file) => ({
            name: file.name,
            sizeBytes: statSync(file.path).size,
            url: linkTo(file),
          })),
        });

        return;
      }

      send(answer, 409, { error: 'notReady' });

      return;
    }

    if (url.pathname === '/v1/ready' && asked.method === 'POST') {
      const body = await readJson(asked);
      const hashes = body.hashes ?? [];

      send(answer, 200, {
        ready: hashes.filter((hash) => byHash.get(hash.toLowerCase())?.isReady === true),
      });

      return;
    }

    if (url.pathname === '/v1/search' && asked.method === 'GET') {
      const tmdb = url.searchParams.get('tmdb');
      const imdb = url.searchParams.get('imdb');

      send(answer, 200, {
        results: entries
          .filter(
            (entry) =>
              (tmdb !== null && entry.tmdbId === tmdb) || (imdb !== null && entry.imdbId === imdb),
          )
          .map((entry) => ({
            infoHash: entry.infoHash,
            name: entry.name,
            sizeBytes: sizeOf(entry),
            isReady: entry.isReady,
          })),
      });

      return;
    }

    if (url.pathname === '/v1/links' && asked.method === 'POST') {
      const body = await readJson(asked);
      const hash = body.infoHash?.toLowerCase() ?? '';
      const entry = byHash.get(hash);

      if (entry === undefined) {
        send(answer, 404, { error: 'unavailable' });

        return;
      }

      if (entry.failure !== undefined) {
        send(answer, 409, { error: entry.failure });

        return;
      }

      const waiting = [...items.values()].find((item) => item.entry === entry);

      if (!entry.isReady && (waiting === undefined || progressOf(waiting) < 1)) {
        if (waiting === undefined) {
          items.set((items.size + 1).toString(), {
            id: (items.size + 1).toString(),
            entry,
            addedAt: now(),
          });
        }

        send(answer, 202, { progress: waiting === undefined ? 0 : progressOf(waiting) });

        return;
      }

      const file =
        entry.files.find((each) => each.name === body.fileName) ??
        [...entry.files].sort(
          (one, other) => statSync(other.path).size - statSync(one.path).size,
        )[0];

      if (file === undefined) {
        send(answer, 404, { error: 'noVideoFile' });

        return;
      }

      send(answer, 200, {
        url: linkTo(file),
        fileName: file.name,
        sizeBytes: statSync(file.path).size,
        expiresAt: new Date(now() + linkSeconds * 1000).toISOString(),
      });

      return;
    }

    send(answer, 404, { error: 'unavailable' });
  };

  const server = createServer((asked, answer) => {
    route(asked, answer).catch(() => {
      send(answer, 500, { error: 'failed' });
    });
  });

  await new Promise<void>((ready) => {
    server.listen(port, host, () => {
      ready();
    });
  });

  const address: AddressInfo | string | null = server.address();

  origin = `http://${host}:${(typeof address === 'object' && address !== null ? address.port : port).toString()}`;

  return {
    origin,
    server,
    stop: () =>
      new Promise((done) => {
        server.closeAllConnections();
        server.close(() => {
          done();
        });
      }),
  };
};

export type { ExampleEntry, ExampleFileService, StartExampleFileServiceOptions };

export { startExampleFileService };
