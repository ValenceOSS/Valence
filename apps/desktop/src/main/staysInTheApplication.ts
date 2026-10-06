import { ORIGIN } from '@ValenceDesktop/main/serveTheApplication';

/**
 * Whether an address the window is being sent to is one of the application's own pages, which are
 * the only pages the window shows.
 *
 * Everything the preload script hands a page — preferences, downloads, the server's address — is
 * handed to whatever page the window holds, so a link that took the window to a site of somebody
 * else's would hand it to them. The scheme and host are compared rather than the origin, because
 * an address on a scheme of its own has no origin to compare: every one of them reports `null`.
 *
 * @param url - Where the window is being sent.
 * @returns Whether it stays inside the application.
 */
const staysInTheApplication = (url: string): boolean => {
  try {
    const asked = new URL(url);
    const own = new URL(ORIGIN);

    return asked.protocol === own.protocol && asked.host === own.host;
  } catch {
    return false;
  }
};

export { staysInTheApplication };
