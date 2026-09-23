import { createGate } from '@ValenceRequests/solver/createGate';
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
 * check it has passed stays passed, and only so many tabs at once.
 *
 * @param context - The browser context it lives in.
 * @param pagesAtOnce - How many tabs it may have working together.
 * @returns The agent.
 */
const createSiteAgent = <P extends PageLike>(context: ContextLike<P>, pagesAtOnce: number) => {
  const gate = createGate(pagesAtOnce);
  const idle: SitePage[] = [];
  let isOpen = true;
  let userAgent: string | null = null;

  context.on('close', () => {
    isOpen = false;
  });

  const withPage = <T>(task: (page: SitePage) => Promise<T>): Promise<T> =>
    gate.run(async () => {
      const page = idle.pop() ?? toSitePage(await context.newPage());

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
