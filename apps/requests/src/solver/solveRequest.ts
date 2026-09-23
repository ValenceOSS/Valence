import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { bytesOf } from '@ValenceRequests/solver/bytesOf';
import { standingOf } from '@ValenceRequests/solver/standingOf';
import type { PageAnswer } from '@ValenceRequests/solver/PageAnswerSchema';
import type { PageRequest } from '@ValenceRequests/solver/PageRequest';
import type { SitePage } from '@ValenceRequests/solver/toSitePage';

type SolveRequestOptions = {
  page: SitePage;
  request: PageRequest;
  deadline: number;
  now?: () => number;
  wait?: (ms: number) => Promise<void>;
};

type Solved = { answer: PageAnswer; bytes: Buffer };

const AFTER_A_CLICK_MS = 3000;

const BETWEEN_LOOKS_MS = 1000;

const BLOCKED = 'The site’s Cloudflare refuses this address outright, which no browser gets past';

/**
 * Waits.
 *
 * @param ms - For how long.
 */
const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Gets a request past a site's browser check, in a tab that keeps the site's cookies.
 *
 * The tab goes to the site first where it is somewhere else, since a page can only ask its own site
 * for things with that site's cookies; while the check shows, its box is clicked and the tab waits
 * for it to let go. Then the request is made from inside the tab, so that it goes out with the
 * cookies the check left and the browser's own way of speaking, and a site that has been passed
 * once answers straight away the next time. A check shown to that request as well is gone
 * through once more before giving up.
 *
 * @param page - The tab.
 * @param request - What to ask for.
 * @param deadline - When to give up, by the clock.
 * @param now - The clock.
 * @param wait - How to wait.
 * @returns What the site said, and its bytes.
 */
const solveRequest = async ({
  page,
  request,
  deadline,
  now = Date.now,
  wait = pause,
}: SolveRequestOptions): Promise<Solved> => {
  const { origin } = new URL(request.url);
  const way = request.method === 'GET' ? request.url : `${origin}/`;

  const clearTheWay = async (): Promise<void> => {
    if ((await page.visit(way, Math.max(deadline - now(), 1))) === 'download') {
      await page.visit(`${origin}/`, Math.max(deadline - now(), 1));
    }

    for (
      let standing = await page.standing();
      standing !== 'clear';
      standing = await page.standing()
    ) {
      if (standing === 'blocked') {
        throw new IndexerFailure(BLOCKED, 'CloudflareRefusesAddress');
      }

      if (now() >= deadline) {
        throw new IndexerFailure(
          'Timed out getting past the site’s browser check',
          'CloudflareCheckFailed',
        );
      }

      await wait((await page.clickTurnstile()) ? AFTER_A_CLICK_MS : BETWEEN_LOOKS_MS);
    }
  };

  const ask = async () => {
    const answer = await page.fetch(request);
    const bytes = bytesOf(answer.dataUrl);
    const standing = standingOf(answer.status, answer.headers.server ?? null, bytes.toString());

    if (standing === 'blocked') {
      throw new IndexerFailure(BLOCKED, 'CloudflareRefusesAddress');
    }

    return { answer, bytes, isChallenge: standing === 'challenged' };
  };

  if (page.origin() !== origin) {
    await clearTheWay();
  }

  let asked = await ask();

  if (asked.isChallenge) {
    await clearTheWay();
    asked = await ask();

    if (asked.isChallenge) {
      throw new IndexerFailure(
        'The site’s browser check would not let the request through',
        'CloudflareCheckFailed',
      );
    }
  }

  return { answer: asked.answer, bytes: asked.bytes };
};

export type { Solved };

export { solveRequest };
