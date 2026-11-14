import { boundedAnswer } from '@ValenceServer/linking/boundedAnswer';
import { SubtitleCuesSchema, SubtitleListSchema } from '@ValenceServer/routes/SubtitleRoute';
import type { SubtitleService } from '@ValenceServer/subtitles/SubtitleService';
import type { LinkedAsker } from './createLinkedAsker';
import type { LinkedTitle } from './createLinkedPlayback';

const OUT_OF_REACH_FROM = 500;

/**
 * What a linked server answered about one of its tracks, with a server that could not be reached,
 * or failed in itself, passed on as a failure rather than taken for a track with nothing in it, so
 * the player asks again.
 *
 * @param answered - The answer, or nothing where the server could not be reached.
 * @returns The answer where it holds the track, or nothing where the server says there is none.
 */
const answerAboutATrack = (answered: Response | null): Response | null => {
  if (answered === null || answered.status >= OUT_OF_REACH_FROM) {
    throw new Error(
      `A linked server could not read a subtitle track (${String(answered?.status)}).`,
    );
  }

  return answered.ok ? answered : null;
};

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
    const read =
      answered?.ok === true
        ? SubtitleListSchema.safeParse(await boundedAnswer(answered).json())
        : null;

    return read?.success === true ? read.data.tracks : null;
  },

  read: async (mediaId, trackId) => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.read(mediaId, trackId);
    }

    const answered = answerAboutATrack(
      await asker.ask(
        linked.serverId,
        `/api/media/${linked.remoteId}/subtitles/${encodeURIComponent(trackId)}`,
      ),
    );

    return answered === null ? null : boundedAnswer(answered).text();
  },

  readCues: async (mediaId, trackId) => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.readCues(mediaId, trackId);
    }

    const answered = answerAboutATrack(
      await asker.ask(
        linked.serverId,
        `/api/media/${linked.remoteId}/subtitles/${encodeURIComponent(trackId)}/cues`,
      ),
    );
    const read =
      answered === null ? null : SubtitleCuesSchema.safeParse(await boundedAnswer(answered).json());

    return read?.success === true ? read.data.cues : null;
  },
  readScript: async (mediaId, trackId) => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.readScript(mediaId, trackId);
    }

    const answered = answerAboutATrack(
      await asker.ask(
        linked.serverId,
        `/api/media/${linked.remoteId}/subtitles/${encodeURIComponent(trackId)}/script`,
      ),
    );

    return answered === null ? null : boundedAnswer(answered).text();
  },
});

export { createLinkedSubtitles };
