import { DOCS_ADDRESS } from '@ValenceContracts/constants/DOCS_ADDRESS';
import { PLAYBACK_PROBLEMS } from '@ValenceContracts/schemas/PlaybackProblem';
import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';

/**
 * Where the documentation says what a playback problem means and how an admin puts it right, by
 * the code a player shows for it.
 *
 * @param problem - The problem, or nothing for the page that lists them all.
 * @returns The address of its entry, or of the page.
 */
const docsForPlaybackProblem = (problem: PlaybackProblem | null): string =>
  problem === null
    ? `${DOCS_ADDRESS}/use/playback-errors`
    : `${DOCS_ADDRESS}/use/playback-errors#error-${PLAYBACK_PROBLEMS[problem].code.toString()}`;

export { docsForPlaybackProblem };
