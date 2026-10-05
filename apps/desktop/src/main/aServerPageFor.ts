import { ORIGIN } from '@ValenceDesktop/main/serveTheApplication';

const SERVER_PAGES = `${ORIGIN}/api/`;

/**
 * Where on the server a page the window was sent to really is, when it is one of the server's own
 * pages rather than the application, such as where a plugin connects an outside account. The window
 * shows only the application: it passes the server's addresses on behind the scenes, so a page that
 * goes on to another site, as an account's sign-in does, would be followed there by this process
 * rather than by somebody's browser, and fail. Such a page belongs in their browser instead.
 *
 * @param url - Where the window was sent.
 * @param server - Where this client's Valence is.
 * @returns The page's address on the server, or nothing where it is the application, or no server
 *   has been chosen.
 */
const aServerPageFor = (url: string, server: string): string | null => {
  if (!url.startsWith(SERVER_PAGES) || server === '') {
    return null;
  }

  try {
    const asked = new URL(url);

    return new URL(asked.pathname + asked.search, server).toString();
  } catch {
    return null;
  }
};

export { aServerPageFor };
