import { createWriteStream } from 'node:fs';
import { mkdir, rename, stat, statfs, truncate } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { judgeFreeSpace } from '@ValenceCore/functions/judgeFreeSpace';
import { openPinnedRequest } from '@ValenceCore/network/openPinnedRequest';
import type { PinnedAnswer, PinnedRequestInit } from '@ValenceCore/network/openPinnedRequest';
import { PinnedRequestRefusal } from '@ValenceCore/network/PinnedRequestRefusal';
import type { DevHost } from '@ValenceCore/network/readDevHosts';
import { saying } from '@ValenceI18n/saying';
import { SaidError } from '@ValenceI18n/SaidError';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { RemoteFile } from '@ValenceSDK/remoteFiles/RemoteFileSchema';

type LinkedFiles = { files: RemoteFile[]; linkHosts: readonly string[] };

type FetchJob = {
  folder: string;
  files: () => Promise<LinkedFiles>;
};

type FetchState =
  | { phase: 'waiting'; doneBytes: number; totalBytes: number | null }
  | {
      phase: 'fetching';
      doneBytes: number;
      totalBytes: number;
      bytesPerSecond: number | null;
    }
  | { phase: 'done'; path: string; totalBytes: number }
  | { phase: 'failed'; problem: Said };

type Open = (
  address: string,
  init: PinnedRequestInit,
  hosts: readonly string[],
  signal: AbortSignal,
) => Promise<PinnedAnswer>;

type CreateLinkFetcherOptions = {
  open?: Open;
  devHosts?: ReadonlyMap<string, DevHost>;
  freeBytesOf?: (folder: string) => Promise<number | null>;
  atOnce?: number;
  now?: () => number;
};

type LinkFetcher = {
  start: (key: string, job: FetchJob) => void;
  stateOf: (key: string) => FetchState | null;
  forget: (key: string) => void;
};

const EXPIRED = new Set([401, 403, 404, 410]);

const MOST_TRIES_PER_FILE = 5;

const RATE_WINDOW_MS = 5000;

/**
 * How much room there is where a folder will be, read from the nearest folder that exists.
 *
 * @param folder - Where the files will go.
 * @returns The free bytes, or null where it cannot be told.
 */
const freeBytesNear = async (folder: string): Promise<number | null> => {
  for (let at = folder; ; at = dirname(at)) {
    const read = await statfs(at).catch(() => null);

    if (read !== null) {
      return read.bavail * read.bsize;
    }

    if (dirname(at) === at) {
      return null;
    }
  }
};

/**
 * How many bytes of a file are on disk already, finished or part-way.
 *
 * @param path - Where the finished file goes.
 * @returns The finished size, or the part-way size, or nothing.
 */
const bytesOnDisk = async (path: string): Promise<{ done: number; part: number }> => ({
  done: (await stat(path).catch(() => null))?.size ?? -1,
  part: (await stat(`${path}.part`).catch(() => null))?.size ?? 0,
});

/**
 * Downloads the files a plugin's download client finished into the folder the requests service
 * files from. Each file is written beside itself as `.part` and renamed once it is whole, and a
 * file part-way through carries on from where it stopped, after a restart as much as after a
 * dropped connection — so the disk itself says how far each download got. Every address is held
 * to the hosts the plugin listed, and a link that has expired is asked for again once. A file that
 * would not fit, or that turns out a different size from the one the plugin gave, fails the
 * download rather than filling the disk. Only so many downloads run at once; the rest wait.
 *
 * @param options - How to open a request, and how many to run at once.
 * @returns The fetcher.
 */
const createLinkFetcher = ({
  devHosts = new Map(),
  open = (address, init, hosts, signal) =>
    openPinnedRequest(address, init, {
      hosts,
      userAgent: 'Valence-Requests',
      devHosts,
      idleMilliseconds: 60_000,
      signal,
    }),
  freeBytesOf = freeBytesNear,
  atOnce = 2,
  now = Date.now,
}: CreateLinkFetcherOptions = {}): LinkFetcher => {
  const states = new Map<string, FetchState>();
  const stops = new Map<string, AbortController>();
  const waiting: { key: string; job: FetchJob }[] = [];
  let running = 0;

  const fail = (key: string, problem: Said): void => {
    states.set(key, { phase: 'failed', problem });
  };

  const fetchFile = async (
    file: RemoteFile,
    target: string,
    count: (bytes: number) => void,
    links: { current: LinkedFiles; renew: () => Promise<void> },
    signal: AbortSignal,
  ): Promise<void> => {
    let hasRenewed = false;

    for (let attempt = 0; attempt < MOST_TRIES_PER_FILE; attempt += 1) {
      signal.throwIfAborted();

      const { part } = await bytesOnDisk(target);
      const from = part > file.sizeBytes ? 0 : part;

      if (from !== part) {
        await truncate(`${target}.part`, 0);
        count(-part);
      }

      if (from === file.sizeBytes && from > 0) {
        await rename(`${target}.part`, target);

        return;
      }

      try {
        const link = links.current.files.find((each) => each.name === file.name) ?? file;
        const answer = await open(
          link.url,
          from > 0 ? { headers: { range: `bytes=${from.toString()}-` } } : {},
          links.current.linkHosts,
          signal,
        );

        if (EXPIRED.has(answer.status) && !hasRenewed) {
          answer.body.resume();
          hasRenewed = true;
          await links.renew();

          continue;
        }

        if (answer.status === 200 && from > 0) {
          answer.body.resume();
          await truncate(`${target}.part`, 0);
          count(-from);

          continue;
        }

        const startsAt =
          answer.status === 206
            ? Number(/^bytes (\d+)-/.exec(answer.headers['content-range'] ?? '')?.[1] ?? -1)
            : 0;

        if ((answer.status !== 200 && answer.status !== 206) || startsAt !== from) {
          answer.body.resume();

          throw new SaidError(
            saying('requests.downloads.linkFetcher.nameCouldNotBeDownloadedStatus', {
              name: file.name,
              status: answer.status,
            }),
          );
        }

        let written = from;

        await pipeline(
          answer.body,
          new Transform({
            transform: (chunk: Buffer, _encoding, next) => {
              written += chunk.byteLength;

              if (written > file.sizeBytes) {
                next(
                  new SaidError(
                    saying('requests.downloads.linkFetcher.nameWasNotTheSizeThe', {
                      name: file.name,
                    }),
                  ),
                );

                return;
              }

              count(chunk.byteLength);
              next(null, chunk);
            },
          }),
          createWriteStream(`${target}.part`, { flags: 'a' }),
        );

        if (written === file.sizeBytes) {
          await rename(`${target}.part`, target);

          return;
        }
      } catch (error) {
        if (
          signal.aborted ||
          error instanceof SaidError ||
          (error instanceof PinnedRequestRefusal && error.reason !== 'slow')
        ) {
          throw error;
        }
      }
    }

    throw new SaidError(
      saying('requests.downloads.linkFetcher.nameKeptStoppingPartWay', { name: file.name }),
    );
  };

  const run = async (key: string, job: FetchJob, signal: AbortSignal): Promise<void> => {
    const links = { current: await job.files(), renew: (): Promise<void> => Promise.resolve() };

    links.renew = async () => {
      links.current = await job.files();
    };

    const folder = resolve(job.folder);
    const totalBytes = links.current.files.reduce((total, file) => total + file.sizeBytes, 0);
    const targets = links.current.files.map((file) => {
      const target = resolve(folder, file.name);

      if (!target.startsWith(`${folder}${sep}`)) {
        throw new SaidError(
          saying('requests.downloads.linkFetcher.nameWouldLeaveTheDownloadFolder', {
            name: file.name,
          }),
        );
      }

      return { file, target };
    });

    let doneBytes = 0;

    for (const { target } of targets) {
      const { done, part } = await bytesOnDisk(target);

      doneBytes += done >= 0 ? done : part;
    }

    const verdict = judgeFreeSpace({
      bytes: totalBytes - doneBytes,
      freeBytes: await freeBytesOf(folder),
    });

    if (verdict === 'willNotFit') {
      throw new SaidError(
        saying('requests.downloads.linkFetcher.thereIsNotRoomInFolder', { folder }),
      );
    }

    const heard: { at: number; bytes: number }[] = [];
    const count = (bytes: number): void => {
      doneBytes += bytes;

      if (signal.aborted) {
        return;
      }

      heard.push({ at: now(), bytes });

      while (heard.length > 0 && (heard[0]?.at ?? 0) < now() - RATE_WINDOW_MS) {
        heard.shift();
      }

      const span = Math.max(1, now() - (heard[0]?.at ?? now()));

      states.set(key, {
        phase: 'fetching',
        doneBytes,
        totalBytes,
        bytesPerSecond:
          heard.length < 2
            ? null
            : Math.round((heard.reduce((sum, each) => sum + each.bytes, 0) * 1000) / span),
      });
    };

    states.set(key, { phase: 'fetching', doneBytes, totalBytes, bytesPerSecond: null });

    for (const { file, target } of targets) {
      if ((await bytesOnDisk(target)).done === file.sizeBytes) {
        continue;
      }

      await mkdir(dirname(target), { recursive: true });
      await fetchFile(file, target, count, links, signal);
    }

    signal.throwIfAborted();
    states.set(key, { phase: 'done', path: folder, totalBytes });
  };

  const next = (): void => {
    while (running < atOnce && waiting.length > 0) {
      const taken = waiting.shift();

      if (taken === undefined || states.get(taken.key)?.phase !== 'waiting') {
        continue;
      }

      running += 1;

      const stop = new AbortController();

      stops.set(taken.key, stop);

      void run(taken.key, taken.job, stop.signal)
        .catch((error) => {
          if (!stop.signal.aborted) {
            fail(
              taken.key,
              error instanceof SaidError
                ? error.said
                : error instanceof PinnedRequestRefusal
                  ? saying('requests.downloads.linkFetcher.aLinkWentToHostWhich', {
                      host: error.hostname,
                    })
                  : saying('requests.downloads.linkFetcher.theFilesCouldNotBeDownloaded'),
            );
          }
        })
        .finally(() => {
          if (stops.get(taken.key) === stop) {
            stops.delete(taken.key);
          }

          running -= 1;
          next();
        });
    }
  };

  return {
    start: (key, job) => {
      if (states.has(key)) {
        return;
      }

      states.set(key, { phase: 'waiting', doneBytes: 0, totalBytes: null });
      waiting.push({ key, job: { ...job, folder: join(job.folder) } });
      next();
    },
    stateOf: (key) => states.get(key) ?? null,
    forget: (key) => {
      stops.get(key)?.abort();
      stops.delete(key);
      states.delete(key);
    },
  };
};

export type { FetchJob, FetchState, LinkFetcher, LinkedFiles };

export { createLinkFetcher };
