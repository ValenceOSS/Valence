import { SegmentListSchema } from '@ValenceServer/routes/SegmentRoute';
import type { SegmentService } from '@ValenceServer/segments/SegmentService';
import type { LinkedAsker } from './createLinkedAsker';
import type { LinkedTitle } from './createLinkedPlayback';

/**
 * The intros, recaps and credits of this server's own titles as they are kept, and of a linked
 * title as the server that has it found them, so skipping works the same on either. A linked
 * title's are never written here, since they belong to the server that has the file.
 *
 * @param local - This server's own segments.
 * @param linkedTitleOf - Which linked server a title is from and what it calls it.
 * @param asker - How a linked server is asked.
 * @returns The segments.
 */
const createLinkedSegments = (
  local: SegmentService,
  linkedTitleOf: (mediaId: string) => Promise<LinkedTitle | null>,
  asker: LinkedAsker,
): SegmentService => ({
  list: async (mediaId) => {
    const linked = await linkedTitleOf(mediaId);

    if (linked === null) {
      return local.list(mediaId);
    }

    const answered = await asker.ask(linked.serverId, `/api/media/${linked.remoteId}/segments`);
    const read = answered?.ok === true ? SegmentListSchema.safeParse(await answered.json()) : null;

    return read?.success === true ? read.data.segments : [];
  },

  replace: async (mediaId, segments) => {
    if ((await linkedTitleOf(mediaId)) === null) {
      await local.replace(mediaId, segments);
    }
  },
});

export { createLinkedSegments };
