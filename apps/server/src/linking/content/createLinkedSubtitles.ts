import { SubtitleCuesSchema, SubtitleListSchema } from '@ValenceServer/routes/SubtitleRoute';
import type { SubtitleService } from '@ValenceServer/subtitles/SubtitleService';
import type { LinkedAsker } from './createLinkedAsker';
import type { LinkedTitle } from './createLinkedPlayback';

/**
 * Subtitles that read this server's own titles' tracks as they always have, and a linked title's
 * by asking the server that has the files, which lists, reads and styles them as it would for its
 * own people.
 *
 * @param local - This server's own subtitles.
 * @param linkedTitleOf - Which linked server a title is from and what it calls it.
 * @param asker - How a linked server is asked.
 * @returns The subtitles.
 */
const createLinkedSubtitles = (
  local: SubtitleService,
  linkedTitleOf: (mediaId: string) => Promise<LinkedTitle | null>,
  asker: LinkedAsker,
): SubtitleService => ({
  list: async (mediaId) => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.list(mediaId);
    }

    const answered = await asker.ask(linked.serverId, `/api/media/${linked.remoteId}/subtitles`);
    const read = answered?.ok === true ? SubtitleListSchema.safeParse(await answered.json()) : null;

    return read?.success === true ? read.data.tracks : null;
  },

  read: async (mediaId, trackId) => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.read(mediaId, trackId);
    }

    const answered = await asker.ask(
      linked.serverId,
      `/api/media/${linked.remoteId}/subtitles/${encodeURIComponent(trackId)}`,
    );

    return answered?.ok === true ? answered.text() : null;
  },

  readCues: async (mediaId, trackId) => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.readCues(mediaId, trackId);
    }

    const answered = await asker.ask(
      linked.serverId,
      `/api/media/${linked.remoteId}/subtitles/${encodeURIComponent(trackId)}/cues`,
    );
    const read = answered?.ok === true ? SubtitleCuesSchema.safeParse(await answered.json()) : null;

    return read?.success === true ? read.data.cues : null;
  },
  readScript: async (mediaId, trackId) => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.readScript(mediaId, trackId);
    }

    const answered = await asker.ask(
      linked.serverId,
      `/api/media/${linked.remoteId}/subtitles/${encodeURIComponent(trackId)}/script`,
    );

    return answered?.ok === true ? answered.text() : null;
  },
});

export { createLinkedSubtitles };
