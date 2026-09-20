import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { createClientCaller } from '@ValenceRequests/downloads/createClientCaller';
import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';
import type {
  ClientFetch,
  ClientItem,
  ClientSettings,
  DownloadClientAdapter,
} from '@ValenceRequests/downloads/DownloadClientAdapter';
import type { QueuedDownloadState } from '@ValenceContracts/schemas/DownloadQueue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const AnswerSchema = z.object({
  result: z.string(),
  arguments: z.record(z.string(), JsonValueSchema).optional(),
});

const AddedSchema = z.object({ hashString: z.string() });

const TorrentSchema = z.object({
  hashString: z.string(),
  name: z.string(),
  status: z.number().int(),
  error: z.number().int().default(0),
  errorString: z.string().default(''),
  percentDone: z.number(),
  sizeWhenDone: z.number(),
  leftUntilDone: z.number(),
  rateDownload: z.number(),
  rateUpload: z.number(),
  eta: z.number(),
  peersSendingToUs: z.number().int(),
  peersGettingFromUs: z.number().int(),
  labels: z.array(z.string()).default([]),
});

const StatsSchema = z.object({ downloadSpeed: z.number(), uploadSpeed: z.number() });

const FIELDS = [
  'hashString',
  'name',
  'status',
  'error',
  'errorString',
  'percentDone',
  'sizeWhenDone',
  'leftUntilDone',
  'rateDownload',
  'rateUpload',
  'eta',
  'peersSendingToUs',
  'peersGettingFromUs',
  'labels',
];

const LOCAL_ERROR = 3;

/**
 * Where Transmission's RPC answers, from whatever address it was given: its own, its web page's, or
 * just the host and port.
 *
 * @param url - The address given.
 * @returns The RPC address.
 */
const rpcAddressOf = (url: string): string => {
  const base = url.replace(/\/+$/, '');

  if (base.endsWith('/rpc')) {
    return base;
  }

  return base.endsWith('/web') ? base.replace(/\/web$/, '/rpc') : `${base}/transmission/rpc`;
};

/**
 * Reads what a torrent is doing from Transmission's status number: 0 stopped, 1 and 2 checking,
 * 3 waiting to download, 4 downloading, 5 and 6 seeding.
 *
 * @param torrent - The torrent.
 * @returns Its state.
 */
const stateOf = (torrent: z.infer<typeof TorrentSchema>): QueuedDownloadState => {
  if (torrent.error === LOCAL_ERROR) {
    return 'failed';
  }

  if (torrent.percentDone >= 1 && (torrent.status === 0 || torrent.status >= 5)) {
    return 'done';
  }

  switch (torrent.status) {
    case 0:
      return 'paused';
    case 1:
    case 2:
      return 'processing';
    case 4:
      return torrent.rateDownload === 0 && torrent.peersSendingToUs === 0
        ? 'stalled'
        : 'downloading';
    default:
      return 'queued';
  }
};

/**
 * Reads one torrent as Transmission lists it.
 *
 * @param torrent - The torrent.
 * @returns It as a download.
 */
const readTorrent = (torrent: z.infer<typeof TorrentSchema>): ClientItem => {
  const state = stateOf(torrent);

  return {
    remoteId: torrent.hashString.toLowerCase(),
    title: torrent.name,
    state,
    problem: torrent.error === 0 || torrent.errorString === '' ? null : torrent.errorString,
    progress: Math.min(Math.max(torrent.percentDone, 0), 1),
    sizeBytes: torrent.sizeWhenDone,
    doneBytes: torrent.sizeWhenDone - torrent.leftUntilDone,
    downloadBytesPerSecond: torrent.rateDownload,
    uploadBytesPerSecond: torrent.rateUpload,
    secondsLeft: state === 'downloading' && torrent.eta >= 0 ? torrent.eta : null,
    seeds: torrent.peersSendingToUs,
    peers: torrent.peersGettingFromUs,
  };
};

/**
 * Speaks to Transmission's RPC, carrying the session id it hands out on the first question and
 * asking again whenever it hands out a new one. Torrents are labelled with the client's category for
 * their kind of library, and only torrents with one of its labels are listed or touched.
 *
 * @param settings - Where it is, how to log in, and the label to keep to.
 * @param fetch - How to ask.
 * @returns The adapter.
 */
const createTransmissionAdapter = (
  settings: ClientSettings,
  fetch: ClientFetch,
): DownloadClientAdapter => {
  const call = createClientCaller(fetch, settings.name);
  const address = rpcAddressOf(settings.url);
  let sessionId = '';

  const rpc = async (method: string, parameters: Record<string, JsonValue> = {}) => {
    const send = () =>
      call(address, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-transmission-session-id': sessionId,
          ...(settings.username === ''
            ? {}
            : {
                authorization: `Basic ${Buffer.from(`${settings.username}:${settings.password}`).toString('base64')}`,
              }),
        },
        body: JSON.stringify({ method, arguments: parameters }),
      });

    let response = await send();

    if (response.status === 409) {
      sessionId = response.headers.get('x-transmission-session-id') ?? '';
      response = await send();
    }

    if (response.status === 401) {
      throw new DownloadClientFailure(`${settings.name} refused the username or password`);
    }

    if (!response.ok) {
      throw new DownloadClientFailure(`${settings.name} answered ${response.status.toString()}`);
    }

    const answer = AnswerSchema.parse(await response.json());

    if (answer.result !== 'success') {
      throw new DownloadClientFailure(`${settings.name} said: ${answer.result}`);
    }

    return answer.arguments ?? {};
  };

  const each = (hash: string) => ({ ids: [hash] });

  return {
    version: async () =>
      z.string().parse((await rpc('session-get', { fields: ['version'] }))['version']),

    add: async (file, _title, category) => {
      if (file.kind === 'nzb') {
        throw new DownloadClientFailure(`${settings.name} takes torrents, not NZBs`);
      }

      const added = await rpc(
        'torrent-add',
        file.kind === 'magnet'
          ? { filename: file.url }
          : { metainfo: Buffer.from(file.bytes).toString('base64') },
      );
      const { hashString } = AddedSchema.parse(
        added['torrent-added'] ?? added['torrent-duplicate'],
      );
      const hash = hashString.toLowerCase();

      await rpc('torrent-set', { ...each(hash), labels: [category] });

      return hash;
    },

    list: async () =>
      z
        .array(TorrentSchema)
        .parse((await rpc('torrent-get', { fields: FIELDS }))['torrents'])
        .filter((torrent) => torrent.labels.some((label) => settings.categories.includes(label)))
        .map(readTorrent),

    speeds: async () => {
      const stats = StatsSchema.parse(await rpc('session-stats'));

      return {
        downloadBytesPerSecond: stats.downloadSpeed,
        uploadBytesPerSecond: stats.uploadSpeed,
      };
    },

    pause: async (hash) => {
      await rpc('torrent-stop', each(hash));
    },

    resume: async (hash) => {
      await rpc('torrent-start', each(hash));
    },

    remove: async (hash, deleteData) => {
      await rpc('torrent-remove', { ...each(hash), 'delete-local-data': deleteData });
    },
  };
};

export { createTransmissionAdapter };
