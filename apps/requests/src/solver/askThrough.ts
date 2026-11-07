import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { bytesOf } from '@ValenceRequests/solver/bytesOf';
import { standingOf } from '@ValenceRequests/solver/standingOf';
import type { PageAnswer } from '@ValenceRequests/solver/PageAnswerSchema';
import type { PageRequest } from '@ValenceRequests/solver/PageRequest';
import type { SitePage } from '@ValenceRequests/solver/toSitePage';
import { saying } from '@ValenceI18n/saying';

type Solved = { answer: PageAnswer; bytes: Buffer };

/**
 * Asks for a page from inside a tab already on its site, with the cookies the site's check left
 * there, and without going through the check itself: where the check stands in the way instead,
 * nothing comes back, for the caller to go through it.
 *
 * @param page - The tab, on the request's site.
 * @param request - What to ask for.
 * @returns What the site said and its bytes, or nothing where the check showed.
 */
const askThrough = async (page: SitePage, request: PageRequest): Promise<Solved | null> => {
  const answer = await page.fetch(request);
  const bytes = bytesOf(answer.dataUrl);
  const standing = standingOf(answer.status, answer.headers.server ?? null, bytes.toString());

  if (standing === 'blocked') {
    throw new IndexerFailure(
      saying('requests.solver.solveRequest.theSitesCloudflareRefusesThisAddress'),
      'CloudflareRefusesAddress',
    );
  }

  return standing === 'challenged' ? null : { answer, bytes };
};

export type { Solved };

export { askThrough };
