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

const RefusalSchema = z.object({ status: z.literal(false), error: z.string() });

const VersionSchema = z.object({ version: z.string() });

const CategoriesSchema = z.object({ categories: z.array(z.string()) });

const AddedSchema = z.object({ status: z.literal(true), nzo_ids: z.array(z.string()).min(1) });

const QueueSchema = z.object({
  queue: z.object({
    kbpersec: z.coerce.number(),
    slots: z.array(
      z.object({
        nzo_id: z.string(),
        filename: z.string(),
        cat: z.string(),
        status: z.string(),
        mb: z.coerce.number(),
        mbleft: z.coerce.number(),
        percentage: z.coerce.number(),
        timeleft: z.string(),
      }),
    ),
  }),
});

const HistorySchema = z.object({
  history: z.object({
    slots: z.array(
      z.object({
        nzo_id: z.string(),
        name: z.string(),
        category: z.string(),
        status: z.string(),
        fail_message: z.string().default(''),
        bytes: z.coerce.number(),
      }),
    ),
  }),
});

const QUEUE_STATES: Readonly<Record<string, QueuedDownloadState>> = {
  Downloading: 'downloading',
  Paused: 'paused',
  Queued: 'queued',
  Fetching: 'queued',
  Grabbing: 'queued',
  Propagating: 'queued',
};

/**
 * Reads SABnzbd's time left, which is hours, minutes and seconds with days in front where there are
 * any.
 *
 * @param text - Such as `0:05:32` or `1:02:03:04`.
 * @returns The seconds.
 */
const readTimeLeft = (text: string): number =>
  text
    .split(':')
    .map(Number)
    .reverse()
    .reduce((total, part, index) => total + part * ([1, 60, 3600, 86_400][index] ?? 0), 0);

/**
 * Speaks to SABnzbd's API with its key. Only jobs in the client's category are listed or touched:
 * those still in its queue, and those it has finished with, from its history. SABnzbd files a job
 * under a category it does not have as its default, where it would never be found again, so the
 * category is made the first time something is sent.
 *
 * SABnzbd downloads one job at a time, so the speed it reports is that job's speed whenever exactly
 * one is downloading.
 *
 * @param settings - Where it is, its API key, and the category to keep to.
 * @param fetch - How to ask.
 * @returns The adapter.
 */
const createSabnzbdAdapter = (
  settings: ClientSettings,
  fetch: ClientFetch,
): DownloadClientAdapter => {
  const call = createClientCaller(fetch, settings.name);
  const address = joinClientPath(settings.url, '/api');

  const read = async (response: Response) => {
    if (response.status === 401 || response.status === 403) {
      throw new DownloadClientFailure(`${settings.name} refused the API key`);
    }

    if (!response.ok) {
      throw new DownloadClientFailure(`${settings.name} answered ${response.status.toString()}`);
    }

    const said = await response.text();
    let body: JsonValue = null;

    try {
      body = JsonValueSchema.parse(JSON.parse(said));
    } catch {
      body = null;
    }

    if (body === null || typeof body !== 'object') {
      throw new DownloadClientFailure(
        /api key/i.test(said)
          ? `${settings.name} refused the API key`
          : `${settings.name} answered, but not as SABnzbd`,
      );
    }

    const refusal = RefusalSchema.safeParse(body);

    if (refusal.success) {
      throw new DownloadClientFailure(
        /api key/i.test(refusal.data.error)
          ? `${settings.name} refused the API key`
          : `${settings.name} said: ${refusal.data.error}`,
      );
    }

    return body;
  };

  const ask = async (parameters: Record<string, string>) =>
    read(
      await call(
        `${address}?${new URLSearchParams({ output: 'json', apikey: settings.apiKey, ...parameters }).toString()}`,
      ),
    );

  const queue = async () => QueueSchema.parse(await ask({ mode: 'queue', limit: '500' })).queue;

  const isOurs = (category: string) => category.toLowerCase() === settings.category.toLowerCase();

  return {
    version: async () => {
      await queue();

      return VersionSchema.parse(await ask({ mode: 'version' })).version;
    },

    add: async (file, title) => {
      if (file.kind !== 'nzb') {
        throw new DownloadClientFailure(`${settings.name} takes NZBs, not torrents`);
      }

      const { categories } = CategoriesSchema.parse(await ask({ mode: 'get_cats' }));

      if (!categories.some(isOurs)) {
        await ask({
          mode: 'set_config',
          section: 'categories',
          keyword: settings.category,
          name: settings.category,
        });
      }

      const form = new FormData();

      form.append('mode', 'addfile');
      form.append('output', 'json');
      form.append('apikey', settings.apiKey);
      form.append('cat', settings.category);
      form.append('nzbname', title);
      form.append(
        'name',
        new Blob([file.bytes.slice()], { type: 'application/x-nzb' }),
        `${title}.nzb`,
      );

      const added = AddedSchema.safeParse(
        await read(await call(address, { method: 'POST', body: form })),
      );

      if (!added.success) {
        throw new DownloadClientFailure(`${settings.name} would not take the NZB`);
      }

      return added.data.nzo_ids[0] ?? '';
    },

    list: async () => {
      const { kbpersec, slots } = await queue();
      const { history } = HistorySchema.parse(await ask({ mode: 'history', limit: '500' }));
      const ours = slots.filter((slot) => isOurs(slot.cat));
      const downloading = ours.filter((slot) => QUEUE_STATES[slot.status] === 'downloading');
      const speed = kbpersec * 1024;

      const queued = ours.map((slot): ClientItem => {
        const state = QUEUE_STATES[slot.status] ?? 'processing';
        const isTheOne = downloading.length === 1 && state === 'downloading';

        return {
          remoteId: slot.nzo_id,
          title: slot.filename,
          state,
          problem: null,
          progress: Math.min(Math.max(slot.percentage / 100, 0), 1),
          sizeBytes: slot.mb * MEBIBYTE,
          doneBytes: (slot.mb - slot.mbleft) * MEBIBYTE,
          downloadBytesPerSecond: isTheOne ? speed : null,
          uploadBytesPerSecond: null,
          secondsLeft: state === 'downloading' ? readTimeLeft(slot.timeleft) : null,
          seeds: null,
          peers: null,
        };
      });

      const finished = history.slots
        .filter((slot) => isOurs(slot.category))
        .map((slot): ClientItem => {
          const state =
            slot.status === 'Completed'
              ? 'done'
              : slot.status === 'Failed'
                ? 'failed'
                : 'processing';

          return {
            remoteId: slot.nzo_id,
            title: slot.name,
            state,
            problem: state === 'failed' ? slot.fail_message || 'SABnzbd could not finish it' : null,
            progress: state === 'failed' ? 0 : 1,
            sizeBytes: slot.bytes,
            doneBytes: state === 'failed' ? null : slot.bytes,
            downloadBytesPerSecond: null,
            uploadBytesPerSecond: null,
            secondsLeft: null,
            seeds: null,
            peers: null,
          };
        });

      return [...queued, ...finished];
    },

    speeds: async () => ({
      downloadBytesPerSecond: (await queue()).kbpersec * 1024,
      uploadBytesPerSecond: null,
    }),

    pause: async (id) => {
      await ask({ mode: 'queue', name: 'pause', value: id });
    },

    resume: async (id) => {
      await ask({ mode: 'queue', name: 'resume', value: id });
    },

    remove: async (id, deleteData) => {
      const files = deleteData ? '1' : '0';

      await ask({ mode: 'queue', name: 'delete', value: id, del_files: files });
      await ask({ mode: 'history', name: 'delete', value: id, del_files: files });
    },
  };
};

export { createSabnzbdAdapter };
