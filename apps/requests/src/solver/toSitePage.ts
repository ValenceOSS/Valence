import { fetchHere } from '@ValenceRequests/solver/fetchHere';
import { PageAnswerSchema } from '@ValenceRequests/solver/PageAnswerSchema';
import { standingOf } from '@ValenceRequests/solver/standingOf';
import type { Standing } from '@ValenceRequests/solver/standingOf';
import type { PageAnswer } from '@ValenceRequests/solver/PageAnswerSchema';
import type { PageRequest } from '@ValenceRequests/solver/PageRequest';

type Box = { x: number; y: number; width: number; height: number };

type ResponseLike = {
  status(): number;
  headers(): Record<string, string>;
  frame(): object;
  request(): { isNavigationRequest(): boolean };
};

type PageLike = {
  url(): string;
  goto(url: string, options: { waitUntil: 'commit'; timeout: number }): Promise<object | null>;
  waitForLoadState(state: 'domcontentloaded', options: { timeout: number }): Promise<void>;
  on(event: 'response', listener: (response: ResponseLike) => void): object;
  mainFrame(): object;
  content(): Promise<string>;
  frames(): { url(): string; frameElement(): Promise<{ boundingBox(): Promise<Box | null> }> }[];
  mouse: { click(x: number, y: number): Promise<void> };
  evaluate(run: (request: PageRequest) => Promise<string>, request: PageRequest): Promise<string>;
  evaluate(run: () => string): Promise<string>;
  close(): Promise<void>;
};

type SitePage = {
  origin: () => string;
  visit: (url: string, timeoutMs: number) => Promise<'visited' | 'download'>;
  standing: () => Promise<Standing>;
  clickTurnstile: () => Promise<boolean>;
  fetch: (request: PageRequest) => Promise<PageAnswer>;
  userAgent: () => Promise<string>;
  close: () => Promise<void>;
};

const TURNSTILE = 'challenges.cloudflare.com';

const CHECKBOX_INSET = 21;

const SETTLE_MS = 5000;

/**
 * Wraps a browser tab in what solving needs of it: where it is, going somewhere, whether the
 * browser check is showing, clicking the check's box, and asking for a page from inside it.
 *
 * A visit waits for the page to arrive, then only a moment for it to be read, since a picture sent
 * as the page is never read at all. A page that cannot be read because it is moving on is taken
 * for the check still, to be looked at again.
 *
 * @param page - The tab.
 * @returns The same tab, as a site page.
 */
const toSitePage = (page: PageLike): SitePage => {
  let shown: ResponseLike | null = null;

  page.on('response', (response) => {
    if (response.request().isNavigationRequest() && response.frame() === page.mainFrame()) {
      shown = response;
    }
  });

  return {
    origin: () => {
      try {
        return new URL(page.url()).origin;
      } catch {
        return 'null';
      }
    },

    visit: async (url, timeoutMs) => {
      try {
        await page.goto(url, { waitUntil: 'commit', timeout: timeoutMs });
        await page
          .waitForLoadState('domcontentloaded', { timeout: Math.min(timeoutMs, SETTLE_MS) })
          .catch(() => {});

        return 'visited';
      } catch (error) {
        if (error instanceof Error && error.message.includes('Download is starting')) {
          return 'download';
        }

        throw error;
      }
    },

    standing: async () => {
      const last: ResponseLike | null = shown;

      if (last === null) {
        return 'clear';
      }

      const body = await page.content().catch(() => null);

      return body === null
        ? 'challenged'
        : standingOf(last.status(), last.headers().server ?? null, body);
    },

    clickTurnstile: async () => {
      const frame = page.frames().find((one) => one.url().includes(TURNSTILE));
      const box = await frame
        ?.frameElement()
        .then((element) => element.boundingBox())
        .catch(() => null);

      if (box === undefined || box === null) {
        return false;
      }

      await page.mouse.click(
        box.x + Math.min(CHECKBOX_INSET, box.width / 2),
        box.y + box.height / 2,
      );

      return true;
    },

    fetch: async (request) =>
      PageAnswerSchema.parse(JSON.parse(await page.evaluate(fetchHere, request))),

    userAgent: () => page.evaluate(() => navigator.userAgent),

    close: () => page.close(),
  };
};

export type { PageLike, ResponseLike, SitePage };

export { toSitePage };
