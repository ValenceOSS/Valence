import { z } from 'zod';
import { FetchedSubtitleSchema } from '@ValenceContracts/schemas/SubtitleFinding';
import { say } from '@ValenceI18n/say';
import type { FetchedSubtitle, SubtitleChoice } from '@ValenceContracts/schemas/SubtitleFinding';

const ProblemSchema = z.object({ error: z.string() });

/**
 * Fetches a subtitle that was found and has the server keep it beside the video, where the player
 * finds it the next time the subtitles are listed.
 *
 * @param mediaId - The film or episode.
 * @param choice - The subtitle chosen.
 * @returns The name it was kept under, or why not.
 */
const fetchFoundSubtitle = async (
  mediaId: string,
  choice: SubtitleChoice,
): Promise<FetchedSubtitle | { problem: string }> => {
  const response = await fetch(`/api/media/${mediaId}/subtitles/found`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(choice),
  }).catch(() => null);

  if (response === null) {
    return { problem: say('common.theServerCouldNotBeReached') };
  }

  const answer = z
    .union([FetchedSubtitleSchema, ProblemSchema])
    .safeParse(await response.json().catch(() => null));

  if (response.ok && answer.success && 'name' in answer.data) {
    return answer.data;
  }

  return {
    problem:
      answer.success && 'error' in answer.data
        ? answer.data.error
        : say('common.theServerAnsweredStatus', { status: response.status.toString() }),
  };
};

export { fetchFoundSubtitle };
