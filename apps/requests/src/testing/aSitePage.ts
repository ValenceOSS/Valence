import { vi } from 'vitest';
import { anAnswer } from '@ValenceRequests/testing/anAnswer';
import type { PageAnswer } from '@ValenceRequests/solver/PageAnswerSchema';
import type { SitePage } from '@ValenceRequests/solver/toSitePage';
import type { Standing } from '@ValenceRequests/solver/standingOf';

type ASitePageOptions = {
  origin?: string;
  standings?: Standing[];
  clicks?: boolean[];
  answers?: PageAnswer[];
  visits?: ('visited' | 'download')[];
};

/**
 * A tab that plays out a script: what the page shows each time it is looked at, whether each
 * click found the box, and what each request gets back, then clear pages and ordinary answers.
 *
 * @param origin - Where the tab starts.
 * @param standings - What each look finds.
 * @param clicks - Whether each click found the box.
 * @param answers - What each request gets.
 * @param visits - How each visit ends.
 * @returns The tab.
 */
const aSitePage = ({
  origin = 'null',
  standings = [],
  clicks = [],
  answers = [],
  visits = [],
}: ASitePageOptions = {}) => {
  let at = origin;

  return {
    origin: () => at,
    visit: vi.fn((url: string) => {
      at = new URL(url).origin;

      return Promise.resolve(visits.shift() ?? 'visited');
    }),
    standing: vi.fn(() => Promise.resolve(standings.shift() ?? 'clear')),
    clickTurnstile: vi.fn(() => Promise.resolve(clicks.shift() ?? false)),
    fetch: vi.fn(() => Promise.resolve(answers.shift() ?? anAnswer())),
    userAgent: vi.fn(() =>
      Promise.resolve('Mozilla/5.0 (Windows NT 10.0; rv:152.0) Firefox/152.0'),
    ),
    isClosed: vi.fn(() => false),
    close: vi.fn(() => Promise.resolve()),
  } satisfies SitePage;
};

export { aSitePage };
