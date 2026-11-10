import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { z } from 'zod';
import { safeFileName } from '@ValenceCore/functions/safeFileName';
import { saying } from '@ValenceI18n/saying';
import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';
import type {
  ClientItem,
  ClientSpeeds,
  DownloadClientAdapter,
} from '@ValenceRequests/downloads/DownloadClientAdapter';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';
import type { LinkFetcher } from '@ValenceRequests/downloads/createLinkFetcher';
import type { SentToPlugin } from '@ValenceRequests/downloads/createPluginAdapter';

const NOTES = '.valence-direct';

const NoteSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  category: z.string(),
});

type Note = z.infer<typeof NoteSchema>;

type CreateDirectAdapterOptions = {
  client: Pick<DownloadClientRecord, 'id' | 'name' | 'localPath' | 'categories'>;
  fetcher: LinkFetcher;
  sent: () => Promise<SentToPlugin[]>;
};

/**
 * Downloads releases that are a plain link, such as a book from an OPDS catalogue, straight into
 * this client's folder, under the category for its library and a folder of its own named by its
 * title, with no download client of another kind in between. Each download's link, name and size
 * are noted in a hidden folder beside them, so one under way carries on after a restart, and the
 * file is fetched only from the host the link names, by the same fetcher that copies a plugin's
 * downloads — which writes each file beside itself as `.part`, resumes it, and refuses one that
 * would not fit.
 *
 * @param client - The client: which it is, its name, and where its files are kept.
 * @param fetcher - What fetches the files.
 * @param sent - What Valence has sent this client.
 * @returns The adapter.
 */
const createDirectAdapter = ({
  client,
  fetcher,
  sent,
}: CreateDirectAdapterOptions): DownloadClientAdapter => {
  const notes = new Map<string, Note>();
  let speeds: ClientSpeeds = { downloadBytesPerSecond: null, uploadBytesPerSecond: null };

  const root = (): string => {
    if (!isAbsolute(client.localPath)) {
      throw new DownloadClientFailure(
        saying('requests.downloads.pluginAdapter.clientHasNoFolderToSave', { client: client.name }),
      );
    }

    return resolve(client.localPath);
  };

  const keyOf = (remoteId: string): string => `${client.id}:${remoteId}`;

  const noteOf = async (remoteId: string): Promise<Note | null> => {
    const known = notes.get(remoteId);

    if (known !== undefined) {
      return known;
    }

    const written = await readFile(join(root(), NOTES, `${remoteId}.json`), 'utf8').catch(
      () => null,
    );
    const read = written === null ? null : NoteSchema.safeParse(JSON.parse(written));

    if (read?.success !== true) {
      return null;
    }

    notes.set(remoteId, read.data);

    return read.data;
  };

  const folderOf = (one: SentToPlugin, note: Note): string | null => {
    const base = resolve(root(), note.category);
    const name = safeFileName(one.title);
    const folder = resolve(base, name === '' ? one.remoteId : `${name} [${one.remoteId}]`);

    return folder.startsWith(`${root()}${sep}`) ? folder : null;
  };

  const itemOf = async (one: SentToPlugin): Promise<ClientItem | null> => {
    const note = await noteOf(one.remoteId);

    if (note === null) {
      return null;
    }

    const base = {
      remoteId: one.remoteId,
      title: one.title,
      phase: 'local' as const,
      problem: null,
      sizeBytes: note.sizeBytes,
      uploadBytesPerSecond: null,
      seeds: null,
      peers: null,
      uploadedBytes: null,
      seedingSeconds: null,
      path: null,
    };
    const folder = folderOf(one, note);

    if (folder === null) {
      return {
        ...base,
        state: 'failed',
        problem: saying('requests.downloads.pluginAdapter.clientCannotSaveThisDownloadInside', {
          client: client.name,
        }),
        progress: 0,
        doneBytes: null,
        downloadBytesPerSecond: null,
        secondsLeft: null,
      };
    }

    if (fetcher.stateOf(keyOf(one.remoteId)) === null) {
      fetcher.start(keyOf(one.remoteId), {
        folder,
        files: () =>
          Promise.resolve({
            files: [{ name: note.name, sizeBytes: note.sizeBytes, url: note.url }],
            linkHosts: [new URL(note.url).hostname],
          }),
      });
    }

    const state = fetcher.stateOf(keyOf(one.remoteId));

    switch (state?.phase) {
      case 'done':
        return {
          ...base,
          state: 'done',
          phase: null,
          progress: 1,
          sizeBytes: state.totalBytes,
          doneBytes: state.totalBytes,
          downloadBytesPerSecond: null,
          secondsLeft: null,
          path: state.path,
        };
      case 'failed':
        return {
          ...base,
          state: 'failed',
          problem: state.problem,
          progress: 0,
          doneBytes: null,
          downloadBytesPerSecond: null,
          secondsLeft: null,
        };
      case 'fetching':
        return {
          ...base,
          state: 'downloading',
          progress: state.totalBytes === 0 ? 0 : Math.min(1, state.doneBytes / state.totalBytes),
          doneBytes: state.doneBytes,
          downloadBytesPerSecond: state.bytesPerSecond,
          secondsLeft:
            state.bytesPerSecond === null || state.bytesPerSecond === 0
              ? null
              : Math.round((state.totalBytes - state.doneBytes) / state.bytesPerSecond),
        };
      case 'waiting':
      case undefined:
        return {
          ...base,
          state: 'queued',
          progress: 0,
          doneBytes: state?.doneBytes ?? 0,
          downloadBytesPerSecond: null,
          secondsLeft: null,
        };
    }
  };

  return {
    version: async () => {
      await mkdir(join(root(), NOTES), { recursive: true });

      return '';
    },

    add: async (file, _title, category) => {
      if (file.kind !== 'link') {
        throw new DownloadClientFailure(
          saying('requests.downloads.directAdapter.nameOnlyTakesDirectDownloads', {
            name: client.name,
          }),
        );
      }

      const remoteId = randomBytes(8).toString('hex');
      const note: Note = { url: file.url, name: file.name, sizeBytes: file.sizeBytes, category };

      await mkdir(join(root(), NOTES), { recursive: true });
      await writeFile(join(root(), NOTES, `${remoteId}.json`), JSON.stringify(note));
      notes.set(remoteId, note);

      return remoteId;
    },

    list: async () => {
      const items = (await Promise.all((await sent()).map(itemOf))).flatMap((item) =>
        item === null ? [] : [item],
      );

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
      const note = await noteOf(remoteId);

      fetcher.forget(keyOf(remoteId));

      const folder = one === undefined || note === null ? null : folderOf(one, note);

      if (deleteData && folder !== null) {
        await rm(folder, { recursive: true, force: true });
      }

      await rm(join(root(), NOTES, `${remoteId}.json`), { force: true });
      notes.delete(remoteId);
    },
  };
};

export { createDirectAdapter };
