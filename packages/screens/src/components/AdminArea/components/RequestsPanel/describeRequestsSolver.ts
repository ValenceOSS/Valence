import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import { saidWhen } from '@ValenceClient/format/saidWhen';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';
import type { RequestsHealth } from './RequestsHealth.types';

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
      label: 'Not checked',
      tone: 'quiet',
      detail: '',
    };
  }

  if (solver.startProblem !== null) {
    return {
      label: 'Can’t start',
      tone: 'danger',
      detail: `It would not start: ${sayAgain(solver.startProblem)}`,
      help: docsFor('CloudflareCheckFailed'),
    };
  }

  if (
    solver.lastFailedAt !== null &&
    (solver.lastPassedAt === null || solver.lastFailedAt > solver.lastPassedAt)
  ) {
    return {
      label: 'Offline',
      tone: 'danger',
      detail: `Last failed ${saidWhen(solver.lastFailedAt)}: ${sayAgainIfAny(solver.problem) ?? 'no reason given'}.`,
      help: docsFor('CloudflareCheckFailed'),
    };
  }

  return {
    label: 'Online',
    tone: 'success',
    detail: '',
  };
};

export { describeRequestsSolver };
