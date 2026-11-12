import { withFrameQuery } from '@ValenceContracts/functions/withFrameQuery';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import { z } from 'zod';
import type { ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';
import { say } from '@ValenceI18n/say';

const AnswerSchema = z.union([
  z.object({ jobId: z.string().nullable() }),
  z.object({ error: z.string() }),
]);

/**
 * Uploads a picture for an item's title and chooses it, for every file of the title.
 *
 * @param mediaId - Any file of the title.
 * @param kind - Which picture.
 * @param picture - The picture.
 * @param frame - Where it sits in its shape, or nothing for its middle.
 * @returns The job the choice started, if any, or what went wrong.
 */
const uploadArtwork = async (
  mediaId: string,
  kind: ArtworkKind,
  picture: Blob,
  frame: PhotoFrame | null = null,
): Promise<{ jobId: string | null } | { problem: string }> => {
  const response = await fetch(
    withFrameQuery(`/api/media/${mediaId}/artwork/${kind}/upload`, frame),
    {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': picture.type },
      body: picture,
    },
  ).catch(() => null);

  if (response === null) {
    return { problem: say('common.theServerCouldNotBeReached') };
  }

  const answer = AnswerSchema.safeParse(await response.json().catch(() => null));

  if (response.ok && answer.success && 'jobId' in answer.data) {
    return { jobId: answer.data.jobId };
  }

  return {
    problem:
      answer.success && 'error' in answer.data
        ? answer.data.error
        : say('common.theServerAnsweredStatus', { status: response.status.toString() }),
  };
};

export { uploadArtwork };
