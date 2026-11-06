import { queryOfPart } from '@ValenceClient/library/queryOfPart';
import type { ArtworkPart } from '@ValenceClient/library/queryOfPart';
import { z } from 'zod';
import { ArtworkChoicesSchema } from '@ValenceContracts/schemas/ArtworkChoice';
import type { ArtworkChoices } from '@ValenceContracts/schemas/ArtworkChoice';
import { say } from '@ValenceI18n/say';

const AnswerSchema = z.union([ArtworkChoicesSchema, z.object({ error: z.string() })]);

/**
 * Asks which posters, backdrops and logos the catalogue has for an item's title, and which are chosen
 * now, for an administrator picking artwork by hand.
 *
 * @param mediaId - Any file of the title.
 * @param part - A season, or an episode, whose own picture is wanted rather than the title's.
 * @returns The choices, or what went wrong in words that can be shown.
 */
const fetchArtworkChoices = async (
  mediaId: string,
  part?: ArtworkPart,
): Promise<ArtworkChoices | { problem: string }> => {
  const response = await fetch(`/api/media/${mediaId}/artwork${queryOfPart(part)}`, {
    credentials: 'same-origin',
  }).catch(() => null);

  if (response === null) {
    return { problem: say('common.theServerCouldNotBeReached') };
  }

  const answer = AnswerSchema.safeParse(await response.json().catch(() => null));

  if (response.ok && answer.success && 'options' in answer.data) {
    return answer.data;
  }

  return {
    problem:
      answer.success && 'error' in answer.data
        ? answer.data.error
        : say('common.theServerAnsweredStatus', { status: response.status.toString() }),
  };
};

export { fetchArtworkChoices };
