import { theBuildInfo } from '@ValenceClient/about/theBuildInfo';
import { describeProblemDetails } from '@ValenceClient/playback/describeProblemDetails';
import type { ProblemFacts } from '@ValenceClient/playback/describeProblemDetails';
import { reportPlaybackProblem } from '@ValenceClient/playback/reportPlaybackProblem';
import { PLAYBACK_PROBLEMS } from '@ValenceContracts/schemas/PlaybackProblem';

type WhatStopped = Omit<ProblemFacts, 'build'> & { mediaId: string; clientId: string };

/**
 * Tells the server's admin what stopped something playing, with the same details the viewer can
 * copy. A passing problem, such as the server being unreachable for a while, is not reported: it
 * puts itself right, and the report could not reach the server anyway.
 *
 * @param stopped - What stopped, what was playing and where, and which device is saying so.
 */
const reportWhatStopped = ({ mediaId, clientId, ...facts }: WhatStopped): void => {
  if (PLAYBACK_PROBLEMS[facts.problem].isPassing) {
    return;
  }

  void reportPlaybackProblem(
    {
      problem: facts.problem,
      mediaId,
      sessionId: facts.sessionId,
      positionSeconds: facts.positionSeconds,
      details: describeProblemDetails({ ...facts, build: theBuildInfo() }),
    },
    clientId,
  );
};

export { reportWhatStopped };
