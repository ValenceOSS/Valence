import { readLinkedAddress } from '@ValenceServer/linking/catalogue/readLinkedAddress';
import { LINKED_SESSION } from './LINKED_SESSION';
import type { Transcoder } from '@ValenceServer/transcoder/TranscoderClient';
import type { LinkedAsker } from './createLinkedAsker';

type Renditions = Pick<
  Transcoder,
  'requestDownload' | 'readDownloadFile' | 'forgetDownload' | 'stopDownload'
>;

const TITLE_ROUTE = /^\/api\/media\/([0-9a-fA-F-]{36})$/u;

/**
 * Where downloads are made, for a title a linked server shares as much as for one of this server's
 * own: a linked title's download is its original file, read from the server that has it as the
 * device fetches it, so it is ready as soon as it is asked for and nothing is made of it here.
 *
 * @param local - This server's own transcoder.
 * @param asker - How a linked server is asked.
 * @returns The renditions.
 */
const linkedRenditions = (local: Renditions, asker: LinkedAsker): Renditions => ({
  requestDownload: async (request) => {
    const linked = readLinkedAddress(request.spec.inputPath);
    const remoteId = linked === null ? undefined : TITLE_ROUTE.exec(linked.route)?.[1];

    return linked === null || remoteId === undefined
      ? local.requestDownload(request)
      : {
          id: `${LINKED_SESSION}${linked.serverId}~${remoteId}`,
          isReady: true,
          progress: 100,
          file: 'original',
          sizeBytes: null,
        };
  },

  readDownloadFile: async (id, name, range) => {
    if (!id.startsWith(LINKED_SESSION)) {
      return local.readDownloadFile(id, name, range);
    }

    const [serverId, remoteId] = id.slice(LINKED_SESSION.length).split('~');
    const headers = new Headers();

    if (range !== null) {
      headers.set('range', range);
    }

    const answered =
      serverId === undefined || remoteId === undefined
        ? null
        : await asker.ask(serverId, `/api/playback/${remoteId}/file`, { headers });

    return answered?.ok === true && answered.body !== null
      ? {
          body: answered.body,
          contentType: answered.headers.get('content-type') ?? 'application/octet-stream',
          status: answered.status,
          contentRange: answered.headers.get('content-range'),
          contentLength: answered.headers.get('content-length'),
        }
      : null;
  },

  forgetDownload: (id) =>
    id.startsWith(LINKED_SESSION) ? Promise.resolve(true) : local.forgetDownload(id),

  stopDownload: (id) =>
    id.startsWith(LINKED_SESSION) ? Promise.resolve(true) : local.stopDownload(id),
});

export type { Renditions };

export { linkedRenditions };
