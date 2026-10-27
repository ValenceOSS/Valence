import { createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { isAbsolute, resolve, sep } from 'node:path';
import { z } from 'zod';
import { categoryKindOf } from '@ValenceContracts/functions/categoryKindOf';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { PluginCallMethod } from '@ValenceContracts/schemas/PluginCall';
import { saying } from '@ValenceI18n/saying';
import type { Said } from '@ValenceI18n/SaidSchema';
import { readMagnetHash } from '@ValenceCore/releases/readMagnetHash';
import { AddAnswerSchema } from '@ValenceSDK/downloadClients/AddAnswerSchema';
import type { DownloadStatus } from '@ValenceSDK/downloadClients/DownloadStatusSchema';
import { FilesAnswerSchema } from '@ValenceSDK/downloadClients/FilesAnswerSchema';
import type { ReleaseIn } from '@ValenceSDK/downloadClients/ReleaseInSchema';
import { StatusAnswerSchema } from '@ValenceSDK/downloadClients/StatusAnswerSchema';
import { MOST_ASKED_AT_ONCE } from '@ValenceSDK/downloadClients/StatusAskSchema';
import { TestAnswerSchema } from '@ValenceSDK/downloadClients/TestAnswerSchema';
import type { RemoteRefusal } from '@ValenceSDK/remoteFiles/RemoteRefusalSchema';
import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';
import type {
  ClientItem,
  ClientSpeeds,
  DownloadClientAdapter,
} from '@ValenceRequests/downloads/DownloadClientAdapter';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';
import type { LinkFetcher, LinkedFiles } from '@ValenceRequests/downloads/createLinkFetcher';
import { readTorrentHash } from '@ValenceRequests/downloads/readTorrentHash';
import type { ReleaseFile } from '@ValenceRequests/indexers/ReleaseFile';
import { safeFileName } from '@ValenceRequests/mediaRequests/safeFileName';
import type { PluginCallChannel } from '@ValenceRequests/pluginCalls/createPluginCallChannel';

type SentToPlugin = { remoteId: string; title: string; libraryKind: LibraryKind };

const NOTHING = z.null();

type CreatePluginAdapterOptions = {
  client: Pick<DownloadClientRecord, 'id' | 'name' | 'plugin' | 'localPath' | 'categories'>;
  channel: Pick<PluginCallChannel, 'call'>;
  fetcher: LinkFetcher;
  sent: () => Promise<SentToPlugin[]>;
};

/**
 * Puts why a plugin's service would not do something into Valence's words, naming the client.
 *
 * @param refusal - What the plugin said.
 * @param client - The client's name.
 * @returns The words.
 */
const saidOf = (refusal: RemoteRefusal, client: string): Said => {
  switch (refusal.reason) {
    case 'notReady':
      return saying('requests.downloads.pluginAdapter.clientHasNotGotItReady', { client });
    case 'limitReached':
      return saying('requests.downloads.pluginAdapter.clientSaysTheAccountHasReached', { client });
    case 'archive':
      return saying('requests.downloads.pluginAdapter.clientOnlyHasItAsA', { client });
    case 'noVideoFile':
      return saying('requests.downloads.pluginAdapter.clientFoundNoVideoInIt', { client });
    case 'tooBig':
      return saying('requests.downloads.pluginAdapter.itIsBiggerThanClientWill', { client });
    case 'unavailable':
      return saying('requests.downloads.pluginAdapter.clientCouldNotBeReachedOr', { client });
    case 'notSetUp':
      return saying('requests.downloads.pluginAdapter.clientIsNotSetUpCheck', { client });
    case 'failed':
      return saying('requests.downloads.pluginAdapter.clientSaysItFailed', { client });
  }
};

/**
 * Turns what Valence fetched for a release into what a plugin's download client is handed.
 *
 * @param file - The magnet link, torrent or NZB.
 * @param title - The release's name.
 * @returns The release, as the SDK describes it.
 */
const releaseInOf = (file: ReleaseFile, title: string): ReleaseIn => {
  switch (file.kind) {
    case 'magnet':
      return { kind: 'magnet', title, magnet: file.url, infoHash: readMagnetHash(file.url) };
    case 'torrent':
      return {
        kind: 'torrent',
        title,
        torrentBase64: Buffer.from(file.bytes).toString('base64'),
        infoHash: readTorrentHash(file.bytes),
      };
    case 'nzb':
      return { kind: 'nzb', title, nzbBase64: Buffer.from(file.bytes).toString('base64') };
  }
};

/**
 * Speaks to a download client a plugin provides. The plugin runs in the Valence server, so each
 * call travels there and back over the plugin call channel. The service downloads each release on
 * its own machines; once it is done, its files are copied into this client's folder here, under
 * the category for its library, and only then is the download done — so filing it works exactly
 * as for any other client. The copy starts a round after the service finishes, which leaves the
 * queue a turn to look at the files and skip any it does not want. Each download is copied into a
 * folder of its own, named by its title and a tag of this client and the service's id for it, so
 * two downloads never share one, and never outside this client's folder, whatever the service
 * calls them; each copy is known by this client and that id too, since two services may use the
 * same ids. Forgetting a download clears its copy here before the service is told, so a service
 * that refuses still leaves nothing behind, and nothing is copied for it again while it is being
 * forgotten. A download that could not be kept inside the client's folder, as a category of `..`
 * would make it, fails and says so.
 *
 * @param client - The client: which it is, its name, which plugin, and where its files are kept
 *   here.
 * @param channel - How a plugin is asked something.
 * @param fetcher - What copies the files here.
 * @param sent - What Valence has sent this client, by the plugin's own id.
 * @returns The adapter.
 */
const createPluginAdapter = ({
  client,
  channel,
  fetcher,
  sent,
}: CreatePluginAdapterOptions): DownloadClientAdapter => {
  const finished = new Set<string>();
  const removing = new Set<string>();
  const skipped = new Map<string, ReadonlySet<number>>();
  let speeds: ClientSpeeds = { downloadBytesPerSecond: null, uploadBytesPerSecond: null };

  const ask = async <T>(
    method: PluginCallMethod,
    asked: JsonValue,
    schema: z.ZodType<T>,
  ): Promise<{ value: T; linkHosts: string[] }> => {
    if (client.plugin === null) {
      throw new DownloadClientFailure(
        saying('requests.downloads.pluginAdapter.clientNamesNoPlugin', { client: client.name }),
      );
    }

    const answered = await channel.call(client.plugin.id, client.plugin.clientId, method, asked);
    const read = schema.safeParse(answered.value);

    if (!read.success) {
      throw new DownloadClientFailure(
        saying('server.service.contributionCalls.nameAnsweredSomethingValenceCouldNot', {
          name: client.name,
        }),
      );
    }

    return { value: read.data, linkHosts: answered.linkHosts };
  };

  const filesOf = async (remoteId: string): Promise<LinkedFiles> => {
    const { value, linkHosts } = await ask('files', { id: remoteId }, FilesAnswerSchema);

    if ('refused' in value) {
      throw new DownloadClientFailure(saidOf(value.refused, client.name));
    }

    const unwanted = skipped.get(remoteId) ?? new Set();

    return { files: value.files.filter((_file, index) => !unwanted.has(index)), linkHosts };
  };

  const copyOf = (remoteId: string): string => `${client.id}:${remoteId}`;

  const folderOf = (one: SentToPlugin): string | null => {
    const tag = createHash('sha256').update(copyOf(one.remoteId)).digest('hex').slice(0, 12);
    const name = safeFileName(one.title);
    const root = resolve(client.localPath);
    const folder = resolve(
      root,
      client.categories[categoryKindOf(one.libraryKind)],
      name === '' ? tag : `${name} [${tag}]`,
    );

    return isAbsolute(client.localPath) && folder.startsWith(`${root}${sep}`) ? folder : null;
  };

  const itemOf = (one: SentToPlugin, status: DownloadStatus | null): ClientItem | null => {
    const base = {
      remoteId: one.remoteId,
      title: one.title,
      problem: null,
      sizeBytes: status?.sizeBytes ?? null,
      uploadBytesPerSecond: null,
      seeds: null,
      peers: null,
      uploadedBytes: null,
      seedingSeconds: null,
      path: null,
    };
    const local = fetcher.stateOf(copyOf(one.remoteId));

    if (local?.phase === 'done') {
      return {
        ...base,
        state: 'done',
        phase: null,
        progress: 1,
        sizeBytes: local.totalBytes,
        doneBytes: local.totalBytes,
        downloadBytesPerSecond: null,
        secondsLeft: null,
        path: local.path,
      };
    }

    if (local?.phase === 'failed') {
      return {
        ...base,
        state: 'failed',
        phase: 'local',
        problem: local.problem,
        progress: 0,
        doneBytes: null,
        downloadBytesPerSecond: null,
        secondsLeft: null,
      };
    }

    if (status === null) {
      return null;
    }

    if (status.state !== 'done') {
      return {
        ...base,
        state: status.state,
        phase: 'remote',
        problem:
          status.state === 'failed'
            ? saidOf(status.failure ?? { reason: 'failed', message: null }, client.name)
            : null,
        progress: status.progress,
        doneBytes: status.doneBytes,
        downloadBytesPerSecond: status.bytesPerSecond,
        secondsLeft: status.secondsLeft,
        seeds: status.seeds,
        peers: status.peers,
      };
    }

    const folder = folderOf(one);

    if (folder === null) {
      return {
        ...base,
        state: 'failed',
        phase: 'local',
        problem: saying('requests.downloads.pluginAdapter.clientCannotSaveThisDownloadInside', {
          client: client.name,
        }),
        progress: 0,
        doneBytes: null,
        downloadBytesPerSecond: null,
        secondsLeft: null,
      };
    }

    if (!finished.has(one.remoteId)) {
      finished.add(one.remoteId);
    } else if (local === null && !removing.has(one.remoteId)) {
      fetcher.start(copyOf(one.remoteId), { folder, files: () => filesOf(one.remoteId) });
    }

    const copying = fetcher.stateOf(copyOf(one.remoteId));
    const totalBytes =
      copying?.phase === 'fetching' ? copying.totalBytes : (status.sizeBytes ?? null);
    const doneBytes = copying?.phase === 'fetching' ? copying.doneBytes : 0;
    const rate = copying?.phase === 'fetching' ? copying.bytesPerSecond : null;

    return {
      ...base,
      state: copying?.phase === 'fetching' ? 'downloading' : 'queued',
      phase: 'local',
      progress: totalBytes === null || totalBytes === 0 ? 0 : Math.min(1, doneBytes / totalBytes),
      sizeBytes: totalBytes,
      doneBytes,
      downloadBytesPerSecond: rate,
      secondsLeft:
        rate === null || rate === 0 || totalBytes === null
          ? null
          : Math.round((totalBytes - doneBytes) / rate),
    };
  };

  const needsAFolder = (): void => {
    if (!isAbsolute(client.localPath)) {
      throw new DownloadClientFailure(
        saying('requests.downloads.pluginAdapter.clientHasNoFolderToSave', { client: client.name }),
      );
    }
  };

  return {
    version: async () => {
      needsAFolder();

      const { value } = await ask('test', {}, TestAnswerSchema);

      if ('refused' in value) {
        throw new DownloadClientFailure(saidOf(value.refused, client.name));
      }

      return value.version ?? value.note ?? '';
    },

    add: async (file, title) => {
      needsAFolder();

      const { value } = await ask('add', releaseInOf(file, title), AddAnswerSchema);

      if ('refused' in value) {
        throw new DownloadClientFailure(saidOf(value.refused, client.name));
      }

      return value.id;
    },

    list: async () => {
      const kept = await sent();
      const statuses = new Map<string, DownloadStatus>();

      for (let at = 0; at < kept.length; at += MOST_ASKED_AT_ONCE) {
        const ids = kept.slice(at, at + MOST_ASKED_AT_ONCE).map((one) => one.remoteId);
        const { value } = await ask('status', { ids }, StatusAnswerSchema);

        for (const status of value.items) {
          statuses.set(status.id, status);
        }
      }

      const items = kept.flatMap((one) => {
        const item = itemOf(one, statuses.get(one.remoteId) ?? null);

        return item === null ? [] : [item];
      });

      speeds = {
        downloadBytesPerSecond: items.reduce(
          (total, item) => total + (item.downloadBytesPerSecond ?? 0),
          0,
        ),
        uploadBytesPerSecond: null,
      };

      return items;
    },

    speeds: () => Promise.resolve(speeds),

    pause: () =>
      Promise.reject(
        new DownloadClientFailure(
          saying('requests.downloads.pluginAdapter.clientCannotPauseADownload', {
            client: client.name,
          }),
        ),
      ),

    resume: () =>
      Promise.reject(
        new DownloadClientFailure(
          saying('requests.downloads.pluginAdapter.clientCannotPauseADownload', {
            client: client.name,
          }),
        ),
      ),

    remove: async (remoteId, deleteData) => {
      const one = (await sent()).find((each) => each.remoteId === remoteId);

      removing.add(remoteId);
      fetcher.forget(copyOf(remoteId));
      finished.delete(remoteId);
      skipped.delete(remoteId);

      const folder = one === undefined ? null : folderOf(one);

      if (deleteData && folder !== null) {
        await rm(folder, { recursive: true, force: true });
      }

      await ask('remove', { id: remoteId }, NOTHING);
      removing.delete(remoteId);
    },

    files: async (remoteId) => {
      const { value } = await ask('files', { id: remoteId }, FilesAnswerSchema);

      return 'refused' in value
        ? null
        : value.files.map((file, index) => ({ index, name: file.name }));
    },

    skip: (remoteId, indices) => {
      skipped.set(remoteId, new Set(indices));

      return Promise.resolve();
    },
  };
};

export type { SentToPlugin };

export { createPluginAdapter };
