import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { createClientCaller } from '@ValenceRequests/downloads/createClientCaller';
import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';
import { joinClientPath } from '@ValenceRequests/downloads/joinClientPath';
import type {
  ClientFetch,
  ClientItem,
  ClientSettings,
  DownloadClientAdapter,
} from '@ValenceRequests/downloads/DownloadClientAdapter';
import type { QueuedDownloadState } from '@ValenceContracts/schemas/DownloadQueue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const MEBIBYTE = 1024 * 1024;

const AnswerSchema = z.union([
  z.object({ error: z.object({ message: z.string() }) }),
  z.object({ result: JsonValueSchema }),
]);

const GroupSchema = z.object({
  NZBID: z.number().int(),
  NZBName: z.string(),
  Category: z.string(),
  Status: z.string(),
  FileSizeMB: z.number(),
  RemainingSizeMB: z.number(),
});

const HistorySchema = z.object({
  NZBID: z.number().int(),
  Name: z.string(),
  Category: z.string(),
  Status: z.string(),
  FileSizeMB: z.number(),
  DestDir: z.string().default(''),
  FinalDir: z.string().default(''),
});

const StatusSchema = z.object({ DownloadRate: z.number() });

const GROUP_STATES: Readonly<Record<string, QueuedDownloadState>> = {
  QUEUED: 'queued',
  FETCHING: 'queued',
  PAUSED: 'paused',
  DOWNLOADING: 'downloading',
};

/**
 * Reads what NZBGet's history says became of a job: `SUCCESS/…` and `WARNING/…` finished, a
 * `DELETED/…` one was taken out, and anything else failed.
 *
 * @param status - Such as `SUCCESS/UNPACK` or `FAILURE/PAR`.
 * @returns Its state, and what went wrong.
 */
const readHistoryStatus = (
  status: string,
): { state: QueuedDownloadState; problem: string | null } => {
  if (status.startsWith('SUCCESS')) {
    return { state: 'done', problem: null };
  }

  if (status.startsWith('WARNING')) {
    return { state: 'done', problem: `NZBGet finished it with a warning (${status})` };
  }

  if (status.startsWith('DELETED')) {
    return {
      state: 'failed',
      problem:
        status === 'DELETED/DUPE' ? 'NZBGet dropped it as a duplicate' : 'It was deleted in NZBGet',
    };
  }

  return { state: 'failed', problem: `NZBGet could not finish it (${status})` };
};

/**
 * Speaks to NZBGet's JSON-RPC with its control username and password. Only jobs in the client's
 * categories are listed or touched: those in its queue, and those in its history.
 *
 * NZBGet reports one speed for everything, so it is a job's speed whenever exactly one is
 * downloading. It keeps a finished job's files wherever it filed them, so removing one only takes it
 * out of the history.
 *
 * @param settings - Where it is, how to log in, and the category to keep to.
 * @param fetch - How to ask.
 * @returns The adapter.
 */
const createNzbgetAdapter = (
  settings: ClientSettings,
  fetch: ClientFetch,
): DownloadClientAdapter => {
  const call = createClientCaller(fetch, settings.name);
  const address = joinClientPath(settings.url, '/jsonrpc');

  const rpc = async (method: string, parameters: JsonValue[] = []): Promise<JsonValue> => {
    const response = await call(address, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(`${settings.username}:${settings.password}`).toString('base64')}`,
      },
      body: JSON.stringify({ method, params: parameters, id: 1 }),
    });

    if (!response.ok) {
      throw response.status === 401 || response.status === 403
        ? new DownloadClientFailure(
            `${settings.name} refused the username or password`,
            'DownloadClientLoginRefused',
          )
        : new DownloadClientFailure(`${settings.name} answered ${response.status.toString()}`);
    }

    const answer = AnswerSchema.safeParse(await response.json().catch(() => null));

    if (!answer.success) {
      throw new DownloadClientFailure(`${settings.name} answered, but not as NZBGet`);
    }

    if ('error' in answer.data) {
      throw new DownloadClientFailure(`${settings.name} said: ${answer.data.error.message}`);
    }

    return answer.data.result;
  };

  const rate = async () => StatusSchema.parse(await rpc('status')).DownloadRate;

  const edit = async (command: string, id: string) => {
    await rpc('editqueue', [command, '', [Number(id)]]);
  };

  return {
    version: async () => z.string().parse(await rpc('version')),

    add: async (file, title, category) => {
      if (file.kind !== 'nzb') {
        throw new DownloadClientFailure(`${settings.name} takes NZBs, not torrents`);
      }

      const id = z
        .number()
        .int()
        .parse(
          await rpc('append', [
            `${title}.nzb`,
            Buffer.from(file.bytes).toString('base64'),
            category,
            0,
            false,
            false,
            '',
            0,
            'SCORE',
            [],
          ]),
        );

      if (id <= 0) {
        throw new DownloadClientFailure(`${settings.name} would not take the NZB`);
      }

      return id.toString();
    },

    list: async () => {
      const groups = z
        .array(GroupSchema)
        .parse(await rpc('listgroups', [0]))
        .filter((group) => settings.categories.includes(group.Category));
      const history = z
        .array(HistorySchema)
        .parse(await rpc('history', [false]))
        .filter((job) => settings.categories.includes(job.Category));
      const downloading = groups.filter((group) => group.Status === 'DOWNLOADING');
      const speed = downloading.length === 1 ? await rate() : null;

      const queued = groups.map((group): ClientItem => {
        const state = GROUP_STATES[group.Status] ?? 'processing';
        const isTheOne = speed !== null && state === 'downloading';
        const remaining = group.RemainingSizeMB * MEBIBYTE;

        return {
          remoteId: group.NZBID.toString(),
          title: group.NZBName,
          state,
          problem: null,
          progress:
            group.FileSizeMB === 0
              ? 0
              : Math.min(Math.max(1 - group.RemainingSizeMB / group.FileSizeMB, 0), 1),
          sizeBytes: group.FileSizeMB * MEBIBYTE,
          doneBytes: (group.FileSizeMB - group.RemainingSizeMB) * MEBIBYTE,
          downloadBytesPerSecond: isTheOne ? speed : null,
          uploadBytesPerSecond: null,
          secondsLeft: isTheOne && speed > 0 ? Math.round(remaining / speed) : null,
          seeds: null,
          peers: null,
          uploadedBytes: null,
          seedingSeconds: null,
          path: null,
        };
      });

      const finished = history.map((job): ClientItem => {
        const { state, problem } = readHistoryStatus(job.Status);

        return {
          remoteId: job.NZBID.toString(),
          title: job.Name,
          state,
          problem,
          progress: state === 'done' ? 1 : 0,
          sizeBytes: job.FileSizeMB * MEBIBYTE,
          doneBytes: state === 'done' ? job.FileSizeMB * MEBIBYTE : null,
          downloadBytesPerSecond: null,
          uploadBytesPerSecond: null,
          secondsLeft: null,
          seeds: null,
          peers: null,
          uploadedBytes: null,
          seedingSeconds: null,
          path: job.FinalDir || job.DestDir || null,
        };
      });

      return [...queued, ...finished];
    },

    speeds: async () => ({ downloadBytesPerSecond: await rate(), uploadBytesPerSecond: null }),

    pause: (id) => edit('GroupPause', id),

    resume: (id) => edit('GroupResume', id),

    remove: async (id, deleteData) => {
      await edit(deleteData ? 'GroupFinalDelete' : 'GroupDelete', id);
      await edit('HistoryFinalDelete', id);
    },
  };
};

export { createNzbgetAdapter };
