import type {
  MediaInput,
  SessionSpec,
  Transcoder,
} from '@ValenceServer/transcoder/TranscoderClient';
import { TranscoderError } from '@ValenceServer/transcoder/TranscoderClient';
import type { DevHost } from '@ValenceCore/network/readDevHosts';
import type { StreamedLinks } from './createStreamedLinks';
import { readRemoteFile } from './readRemoteFile';
import { readStreamedPath } from './readStreamedPath';

type Streamed = {
  itemOfPath: (path: string) => Promise<string | null>;
  fileNameOf: (mediaItemId: string) => Promise<string | null>;
  links: Pick<StreamedLinks, 'linkFor'>;
  devHosts?: ReadonlyMap<string, DevHost>;
  read?: typeof readRemoteFile;
};

const NOT_FOUND = 404;

/**
 * A transcoder that plays a film streamed from a source wherever it would play a file: a request
 * naming a streamed film's path names, instead, the remote input its current link is registered as
 * — probing it, starting a session on it — and reading the file itself, for a device that plays it
 * as it is, fetches it straight from the source. A link that has stopped working is asked for again
 * once.
 *
 * @param transcoder - The transcoder to ask.
 * @param streamed - How a streamed film's path leads to its title, and where it is fetched from now.
 * @returns The same transcoder, reaching streamed films too.
 */
const withStreamedInputs = <Asked extends Transcoder>(
  transcoder: Asked,
  { itemOfPath, fileNameOf, links, devHosts = new Map(), read = readRemoteFile }: Streamed,
): Asked => {
  /**
   * The title a path is the streamed film of, where it is one.
   *
   * @param path - The path.
   * @returns The title, null where the path is a file's, or a refusal where the film is gone.
   */
  const titleOf = async (path: string): Promise<string | null> => {
    if (readStreamedPath(path) === null) {
      return null;
    }

    const mediaItemId = await itemOfPath(path);

    if (mediaItemId === null) {
      throw new TranscoderError('That streamed film is no longer known.', NOT_FOUND);
    }

    return mediaItemId;
  };

  /**
   * What the media service is to read for a request's input.
   *
   * @param input - What the request names.
   * @returns The remote input a streamed film is registered as, or the input as it was.
   */
  const relayed = async (input: MediaInput): Promise<MediaInput> => {
    const mediaItemId = typeof input === 'string' ? await titleOf(input) : null;

    return mediaItemId === null ? input : { remote: (await links.linkFor(mediaItemId)).key };
  };

  const relayedSpec = async (spec: SessionSpec): Promise<SessionSpec> => ({
    ...spec,
    inputPath: await relayed(spec.inputPath),
  });

  const { probeRemote } = transcoder;

  return {
    ...transcoder,
    probe: async (path) => {
      const mediaItemId = await titleOf(path);

      if (mediaItemId === null || probeRemote === undefined) {
        return transcoder.probe(path);
      }

      return probeRemote((await links.linkFor(mediaItemId)).key);
    },
    startSession: async (spec, deviceId, variants) =>
      transcoder.startSession(
        await relayedSpec(spec),
        deviceId,
        variants === undefined ? undefined : await Promise.all(variants.map(relayedSpec)),
      ),
    readFile: async (path, range) => {
      const mediaItemId = await titleOf(path);

      if (mediaItemId === null) {
        return transcoder.readFile(path, range);
      }

      const fileName = await fileNameOf(mediaItemId);
      const first = await read({ ...(await links.linkFor(mediaItemId)), fileName }, range, {
        devHosts,
      });

      if (first !== 'expired') {
        return first;
      }

      const again = await read({ ...(await links.linkFor(mediaItemId, true)), fileName }, range, {
        devHosts,
      });

      return again === 'expired' ? null : again;
    },
  };
};

export { withStreamedInputs };
