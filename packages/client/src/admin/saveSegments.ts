import { z } from 'zod';
import { MediaSegmentSchema } from '@ValenceContracts/schemas/MediaSegment';
import type { MediaSegment, SegmentKind } from '@ValenceContracts/schemas/MediaSegment';
import { say } from '@ValenceI18n/say';

const AnswerSchema = z.union([
  z.object({ segments: z.array(MediaSegmentSchema) }),
  z.object({ error: z.string() }),
]);

/**
 * Sets a file's skip markers by hand: its intro, recap, credits and preview, kept as they are
 * through every detection run after.
 *
 * @param mediaId - The file.
 * @param segments - Every marker it is to have.
 * @returns The markers it has now, or what went wrong.
 */
const saveSegments = async (
  mediaId: string,
  segments: readonly { kind: SegmentKind; startSeconds: number; endSeconds: number }[],
): Promise<MediaSegment[] | { problem: string }> => {
  const response = await fetch(`/api/media/${mediaId}/segments`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ segments }),
  }).catch(() => null);

  if (response === null) {
    return { problem: say('common.theServerCouldNotBeReached') };
  }

  const answer = AnswerSchema.safeParse(await response.json().catch(() => null));

  if (response.ok && answer.success && 'segments' in answer.data) {
    return answer.data.segments;
  }

  return {
    problem:
      answer.success && 'error' in answer.data
        ? answer.data.error
        : say('common.theServerAnsweredStatus', { status: response.status.toString() }),
  };
};

export { saveSegments };
