import { AUDIO_QUALITY_KBPS } from '@ValenceContracts/schemas/Music';
import type { AudioQuality } from '@ValenceContracts/schemas/Music';
import type { Rendition } from '@ValenceServer/music/renditionFor';
import type { TranscoderStreamedFile } from '@ValenceServer/transcoder/TranscoderClient';
import type { LinkedAsker } from './createLinkedAsker';

const TITLE_ROUTE = /^\/api\/media\/([0-9a-fA-F-]{36})$/u;

/**
 * The quality to ask a linked server for, to be sent the rendition this server would have made.
 *
 * @param rendition - The rendition.
 * @returns The quality.
 */
const qualityOf = (rendition: Rendition): AudioQuality => {
  if (rendition.kind === 'original') {
    return 'lossless';
  }

  const found = Object.entries(AUDIO_QUALITY_KBPS).find(([, kbps]) => kbps === rendition.kbps)?.[0];

  return found === 'high' || found === 'normal' || found === 'low' ? found : 'normal';
};

/**
 * Streams a song a linked server shares, at the quality this server would have sent it, with the
 * range asked for, as that server sends it.
 *
 * @param asker - How a linked server is asked.
 * @param linked - The linked server and the route of the song on it.
 * @param rendition - What quality to send.
 * @param range - The range asked for, if any.
 * @returns The stream, or nothing where there is none.
 */
const streamLinkedTrack = async (
  asker: LinkedAsker,
  linked: { serverId: string; route: string },
  rendition: Rendition,
  range: string | null,
): Promise<TranscoderStreamedFile | null> => {
  const remoteId = TITLE_ROUTE.exec(linked.route)?.[1];

  if (remoteId === undefined) {
    return null;
  }

  const headers = new Headers();

  if (range !== null) {
    headers.set('range', range);
  }

  const answered = await asker.ask(
    linked.serverId,
    `/api/music/tracks/${remoteId}/stream?quality=${qualityOf(rendition)}`,
    { headers },
  );

  return answered?.ok === true && answered.body !== null
    ? {
        body: answered.body,
        contentType: answered.headers.get('content-type') ?? 'audio/mpeg',
        status: answered.status,
        contentRange: answered.headers.get('content-range'),
        contentLength: answered.headers.get('content-length'),
      }
    : null;
};

export { streamLinkedTrack };
