import { describeTheBuild } from '@ValenceClient/about/describeTheBuild';
import type { BuildInfo } from '@ValenceClient/platform/Platform.types';
import { describePlaybackProblem } from '@ValenceClient/playback/describePlaybackProblem';
import { docsForPlaybackProblem } from '@ValenceCore/functions/docsForPlaybackProblem';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';
import { say } from '@ValenceI18n/say';

type ProblemFacts = {
  problem: PlaybackProblem;
  cause: string | null;
  title: string;
  positionSeconds: number | null;
  how: string | null;
  sessionId: string | null;
  build: BuildInfo | null;
};

/**
 * The details a player copies about what stopped it, for somebody to paste to their server's admin:
 * the code and what it means, what the player itself reported, what was playing and how far in, how
 * it was being played, the session, which build of Valence on which device, and the documentation's
 * entry for the code. Anything not known is left out rather than written as blank.
 *
 * @param facts - What is known about it.
 * @returns The details, a line each.
 */
const describeProblemDetails = ({
  problem,
  cause,
  title,
  positionSeconds,
  how,
  sessionId,
  build,
}: ProblemFacts): string => {
  const described = describePlaybackProblem(problem);

  return [
    say('client.playback.playbackProblems.detailsHeading', {
      code: described.code.toString(),
      heading: described.heading,
    }),
    cause === null || cause === ''
      ? null
      : say('client.playback.playbackProblems.detailsCause', { cause }),
    positionSeconds === null
      ? null
      : say('client.playback.playbackProblems.detailsPlaying', {
          title,
          position: formatDuration(positionSeconds),
        }),
    how === null ? null : say('client.playback.playbackProblems.detailsHow', { how }),
    sessionId === null
      ? null
      : say('client.playback.playbackProblems.detailsSession', { session: sessionId }),
    describeTheBuild(build, null),
    say('client.playback.playbackProblems.detailsMore', {
      address: docsForPlaybackProblem(problem),
    }),
  ]
    .filter((line) => line !== null)
    .join('\n');
};

export type { ProblemFacts };

export { describeProblemDetails };
