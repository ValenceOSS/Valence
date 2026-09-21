import { z } from 'zod';
import { createClientCaller } from '@ValenceRequests/downloads/createClientCaller';
import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';
import { joinClientPath } from '@ValenceRequests/downloads/joinClientPath';
import { readMagnetHash } from '@ValenceRequests/downloads/readMagnetHash';
import { readTorrentHash } from '@ValenceRequests/downloads/readTorrentHash';
import type {
  ClientFetch,
  ClientItem,
  ClientSettings,
  DownloadClientAdapter,
} from '@ValenceRequests/downloads/DownloadClientAdapter';
import type { QueuedDownloadState } from '@ValenceContracts/schemas/DownloadQueue';

const TorrentSchema = z.object({
  hash: z.string(),
  name: z.string(),
  state: z.string(),
  progress: z.number(),
  size: z.number().optional(),
  total_size: z.number().optional(),
  completed: z.number().optional(),
  dlspeed: z.number().optional(),
  upspeed: z.number().optional(),
  eta: z.number().optional(),
  num_seeds: z.number().optional(),
  num_leechs: z.number().optional(),
  uploaded: z.number().optional(),
  seeding_time: z.number().optional(),
  content_path: z.string().optional(),
});

const FileSchema = z.object({ name: z.string(), index: z.number().int().optional() });

const TransferSchema = z.object({ dl_info_speed: z.number(), up_info_speed: z.number() });

const NEVER_SECONDS = 8_640_000;

const STATES: Readonly<Record<string, QueuedDownloadState>> = {
  error: 'failed',
  missingFiles: 'failed',
  uploading: 'done',
  stalledUP: 'done',
  queuedUP: 'done',
  forcedUP: 'done',
  pausedUP: 'done',
  stoppedUP: 'done',
  checkingUP: 'done',
  downloading: 'downloading',
  forcedDL: 'downloading',
  metaDL: 'downloading',
  forcedMetaDL: 'downloading',
  stalledDL: 'stalled',
  pausedDL: 'paused',
  stoppedDL: 'paused',
  queuedDL: 'queued',
  allocating: 'queued',
  checkingDL: 'processing',
  checkingResumeData: 'processing',
  moving: 'processing',
};

const PROBLEMS: Readonly<Record<string, string>> = {
  error: 'qBittorrent reports an error with this torrent',
  missingFiles: 'qBittorrent cannot find its files',
};

/**
 * Reads one torrent as qBittorrent lists it.
 *
 * @param torrent - The torrent.
 * @returns It as a download.
 */
const readTorrent = (torrent: z.infer<typeof TorrentSchema>): ClientItem => {
  const state = STATES[torrent.state] ?? 'queued';
  const sizeBytes = torrent.size ?? torrent.total_size ?? null;

  return {
    remoteId: torrent.hash.toLowerCase(),
    title: torrent.name,
    state,
    problem: PROBLEMS[torrent.state] ?? null,
    progress: Math.min(Math.max(torrent.progress, 0), 1),
    sizeBytes,
    doneBytes: torrent.completed ?? (sizeBytes === null ? null : sizeBytes * torrent.progress),
    downloadBytesPerSecond: torrent.dlspeed ?? null,
    uploadBytesPerSecond: torrent.upspeed ?? null,
    secondsLeft:
      state === 'downloading' && torrent.eta !== undefined && torrent.eta < NEVER_SECONDS
        ? torrent.eta
        : null,
    seeds: torrent.num_seeds ?? null,
    peers: torrent.num_leechs ?? null,
    uploadedBytes: torrent.uploaded ?? null,
    seedingSeconds: torrent.seeding_time ?? null,
    path:
      torrent.content_path === undefined || torrent.content_path === ''
        ? null
        : torrent.content_path,
  };
};

/**
 * Speaks to qBittorrent's web API, logging in with a cookie that is kept and renewed when it
 * lapses. Only torrents in the client's categories — one for each kind of library — are listed or
 * touched, and a category is made the first time something is added to it.
 *
 * qBittorrent 5 renamed pausing and resuming to stopping and starting, so the new words are tried
 * first and the old ones where they are not known. It also names its session cookie after its port,
 * `QBT_SID_8080` rather than `SID`, and answers a login with nothing rather than `Ok.`, so the cookie
 * is found by what it holds rather than by one name. A torrent it already has is refused as a
 * conflict; that one is filed under the category instead, so it is followed like any other.
 *
 * @param settings - Where it is, how to log in, and the category to keep to.
 * @param fetch - How to ask.
 * @returns The adapter.
 */
const createQbittorrentAdapter = (
  settings: ClientSettings,
  fetch: ClientFetch,
): DownloadClientAdapter => {
  const call = createClientCaller(fetch, settings.name);
  let cookie: string | null = null;

  const login = async (): Promise<void> => {
    const response = await call(joinClientPath(settings.url, '/api/v2/auth/login'), {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        referer: settings.url,
      },
      body: new URLSearchParams({
        username: settings.username,
        password: settings.password,
      }).toString(),
    });

    if (response.status === 403) {
      throw new DownloadClientFailure(
        `${settings.name} has banned this address after too many wrong passwords`,
      );
    }

    const said = await response.text();

    if (!response.ok || said.trim() === 'Fails.') {
      throw new DownloadClientFailure(`${settings.name} refused the username or password`);
    }

    cookie =
      /(?:^|[\s,])([\w-]*SID[\w-]*=[^;,\s]+)/.exec(response.headers.get('set-cookie') ?? '')?.[1] ??
      '';
  };

  const ask = async (path: string, form?: URLSearchParams | FormData): Promise<Response> => {
    const send = () =>
      call(joinClientPath(settings.url, path), {
        method: form === undefined ? 'GET' : 'POST',
        headers: {
          referer: settings.url,
          ...(cookie === null || cookie === '' ? {} : { cookie }),
          ...(form instanceof URLSearchParams
            ? { 'content-type': 'application/x-www-form-urlencoded' }
            : {}),
        },
        ...(form === undefined ? {} : { body: form instanceof FormData ? form : form.toString() }),
      });

    if (cookie === null) {
      await login();
    }

    let response = await send();

    if (response.status === 403) {
      await login();
      response = await send();
    }

    if (response.status === 403) {
      throw new DownloadClientFailure(`${settings.name} refused the username or password`);
    }

    return response;
  };

  const answered = async (path: string, form?: URLSearchParams | FormData): Promise<Response> => {
    const response = await ask(path, form);

    if (!response.ok) {
      throw new DownloadClientFailure(`${settings.name} answered ${response.status.toString()}`);
    }

    return response;
  };

  const eitherOf = async (paths: readonly [string, string], form: URLSearchParams) => {
    const response = await ask(paths[0], form);

    if (response.status === 404) {
      await answered(paths[1], form);

      return;
    }

    if (!response.ok) {
      throw new DownloadClientFailure(`${settings.name} answered ${response.status.toString()}`);
    }
  };

  return {
    version: async () => (await (await answered('/api/v2/app/version')).text()).trim(),

    add: async (file, _title, category) => {
      if (file.kind === 'nzb') {
        throw new DownloadClientFailure(`${settings.name} takes torrents, not NZBs`);
      }

      const hash = file.kind === 'magnet' ? readMagnetHash(file.url) : readTorrentHash(file.bytes);

      if (hash === null) {
        throw new DownloadClientFailure('The release is not a torrent Valence can read');
      }

      const made = await ask(
        '/api/v2/torrents/createCategory',
        new URLSearchParams({ category, savePath: '' }),
      );

      if (!made.ok && made.status !== 409) {
        throw new DownloadClientFailure(`${settings.name} would not make the category ${category}`);
      }

      const form = new FormData();

      if (file.kind === 'magnet') {
        form.append('urls', file.url);
      } else {
        form.append(
          'torrents',
          new Blob([file.bytes.slice()], { type: 'application/x-bittorrent' }),
          'release.torrent',
        );
      }

      form.append('category', category);

      const response = await ask('/api/v2/torrents/add', form);

      if (response.status === 409) {
        await answered(
          '/api/v2/torrents/setCategory',
          new URLSearchParams({ hashes: hash, category }),
        );

        return hash;
      }

      if (!response.ok || (await response.text()).trim() === 'Fails.') {
        throw new DownloadClientFailure(`${settings.name} would not take the torrent`);
      }

      return hash;
    },

    list: async () =>
      (
        await Promise.all(
          settings.categories.map(async (category) =>
            z
              .array(TorrentSchema)
              .parse(
                await (
                  await answered(`/api/v2/torrents/info?category=${encodeURIComponent(category)}`)
                ).json(),
              ),
          ),
        )
      )
        .flat()
        .map(readTorrent),

    speeds: async () => {
      const transfer = TransferSchema.parse(await (await answered('/api/v2/transfer/info')).json());

      return {
        downloadBytesPerSecond: transfer.dl_info_speed,
        uploadBytesPerSecond: transfer.up_info_speed,
      };
    },

    pause: (hash) =>
      eitherOf(
        ['/api/v2/torrents/stop', '/api/v2/torrents/pause'],
        new URLSearchParams({ hashes: hash }),
      ),

    resume: (hash) =>
      eitherOf(
        ['/api/v2/torrents/start', '/api/v2/torrents/resume'],
        new URLSearchParams({ hashes: hash }),
      ),

    remove: async (hash, deleteData) => {
      await answered(
        '/api/v2/torrents/delete',
        new URLSearchParams({ hashes: hash, deleteFiles: deleteData ? 'true' : 'false' }),
      );
    },

    files: async (hash) => {
      const listed = z
        .array(FileSchema)
        .parse(
          await (await answered(`/api/v2/torrents/files?hash=${encodeURIComponent(hash)}`)).json(),
        );

      return listed.length === 0
        ? null
        : listed.map((file, position) => ({ index: file.index ?? position, name: file.name }));
    },

    skip: async (hash, indices) => {
      if (indices.length === 0) {
        return;
      }

      await answered(
        '/api/v2/torrents/filePrio',
        new URLSearchParams({ hash, id: indices.join('|'), priority: '0' }),
      );
    },
  };
};

export { createQbittorrentAdapter };
