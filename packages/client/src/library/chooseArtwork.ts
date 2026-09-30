import { z } from 'zod';
import type { ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';

const AnswerSchema = z.union([
  z.object({ jobId: z.string().nullable() }),
  z.object({ error: z.string() }),
]);

/**
 * Chooses one of the catalogue's pictures for an item's title, or with none, goes back to the
 * catalogue's own pick.
 *
 * @param mediaId - Any file of the title.
 * @param kind - Which picture.
 * @param url - The picture chosen, or null to go back to the catalogue's.
 * @returns The job putting the catalogue's pick back where one was needed, or what went wrong.
 */
const chooseArtwork = async (
  mediaId: string,
  kind: ArtworkKind,
  url: string | null,
): Promise<{ jobId: string | null } | { problem: string }> => {
  const response = await fetch(`/api/media/${mediaId}/artwork/${kind}`, {
    method: url === null ? 'DELETE' : 'PUT',
    credentials: 'same-origin',
    ...(url === null
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) }),
  }).catch(() => null);

  if (response === null) {
    return { problem: 'The server could not be reached.' };
  }

  const answer = AnswerSchema.safeParse(await response.json().catch(() => null));

  if (response.ok && answer.success && 'jobId' in answer.data) {
    return { jobId: answer.data.jobId };
  }

  return {
    problem:
      answer.success && 'error' in answer.data
        ? answer.data.error
        : `The server answered ${response.status.toString()}.`,
  };
};

export { chooseArtwork };
