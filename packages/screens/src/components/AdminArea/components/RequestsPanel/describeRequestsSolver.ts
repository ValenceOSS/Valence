import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';
import type { RequestsHealth } from './RequestsHealth.types';
import { say } from '@ValenceI18n/say';

/**
 * Says how the browser that gets past Cloudflare's check is, as a badge in the same words and
 * colours as the requests service's own row, and what went wrong where something did. The
 * browser opens only when a site asks for it and closes once none has for a while, so a browser that
 * is not running is working rather than broken; one that will not start, or whose last request
 * failed, is the fault, and says why.
 *
 * @param overview - What the server last heard from the requests service.
 * @returns The badge's words and tone, and the line to show with it.
 */
const describeRequestsSolver = (overview: RequestsOverview): RequestsHealth => {
  const solver = overview.status?.solver ?? null;

  if (solver === null) {
    return {
      label: say('common.notChecked'),
      tone: 'quiet',
      detail: '',
    };
  }

  if (solver.startProblem !== null) {
    return {
      label: say('screens.requestsPanel.describeRequestsSolver.cantStart'),
      tone: 'danger',
      detail: say('screens.requestsPanel.describeRequestsSolver.itWouldNotStartStartProblem', {
        startProblem: sayAgain(solver.startProblem),
      }),
      help: docsFor('CloudflareCheckFailed'),
    };
  }

  if (
    solver.lastFailedAt !== null &&
    (solver.lastPassedAt === null || solver.lastFailedAt > solver.lastPassedAt)
  ) {
    const failedWhen = saidWhen(solver.lastFailedAt);
    const problem = sayAgainIfAny(solver.problem) ?? say('common.noReasonGiven');

    return {
      label: say('common.offline'),
      tone: 'danger',
      detail:
        failedWhen === null
          ? say('screens.requestsPanel.describeRequestsSolver.failedProblem', { problem })
          : say('screens.requestsPanel.describeRequestsSolver.lastFailedWhenProblem', {
              when: failedWhen,
              problem,
            }),
      help: docsFor('CloudflareCheckFailed'),
    };
  }

  return {
    label: say('common.online'),
    tone: 'success',
    detail: '',
  };
};

export { describeRequestsSolver };
