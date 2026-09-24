import { createGate } from '@ValenceRequests/solver/createGate';
import type { Gate } from '@ValenceRequests/solver/createGate';
import { toSitePage } from '@ValenceRequests/solver/toSitePage';
import type { PageLike, SitePage } from '@ValenceRequests/solver/toSitePage';

type Cookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
};

type ContextLike<P extends PageLike> = {
  newPage(): Promise<P>;
  addCookies(cookies: { name: string; value: string; url: string }[]): Promise<void>;
  cookies(urls: string): Promise<Cookie[]>;
  close(): Promise<void>;
  on(event: 'close', listener: () => void): object;
};

/**
 * One site's corner of the browser: its own cookies and tabs, kept between requests so that a
 * check it has passed stays passed, and only so many tabs at once. A kept tab that has been closed
 * since, as one that ran out of time is, is passed over for a new one. A new tab is opened only when
 * the browser's turn for opening comes round, since Firefox opening several at the same moment
 * leaves Cloudflare's check unable to finish in any of them.
 *
 * @param context - The browser context it lives in.
 * @param pagesAtOnce - How many tabs it may have working together.
 * @param opening - The turns for opening a tab, shared by the whole browser.
 * @returns The agent.
 */
const createSiteAgent = <P extends PageLike>(
  context: ContextLike<P>,
  pagesAtOnce: number,
  opening: Pick<Gate, 'run'>,
) => {
  const gate = createGate(pagesAtOnce);
  const idle: SitePage[] = [];
  let isOpen = true;
  let userAgent: string | null = null;

  context.on('close', () => {
    isOpen = false;
  });

  const withPage = <T>(task: (page: SitePage) => Promise<T>): Promise<T> =>
    gate.run(async () => {
      const kept = idle.splice(0).filter((one) => !one.isClosed());
      const page = kept.pop() ?? toSitePage(await opening.run(() => context.newPage()));

      idle.push(...kept);

      try {
        const result = await task(page);

        idle.push(page);

        return result;
      } catch (error) {
        await page.close().catch(() => {});
        throw error;
      }
    });

  return {
    withPage,
    addCookies: async (cookies: { name: string; value: string }[], url: string): Promise<void> => {
      if (cookies.length > 0) {
        await context.addCookies(cookies.map((cookie) => ({ ...cookie, url })));
      }
    },
    cookies: (url: string): Promise<Cookie[]> => context.cookies(url),
    userAgent: async (page: SitePage): Promise<string> => {
      userAgent ??= await page.userAgent();

      return userAgent;
    },
    busy: (): number => gate.busy(),
    isOpen: (): boolean => isOpen,
    close: async (): Promise<void> => {
      isOpen = false;
      await context.close().catch(() => {});
    },
  };
};

type SiteAgent = ReturnType<typeof createSiteAgent>;

export type { ContextLike, Cookie, SiteAgent };

export { createSiteAgent };
