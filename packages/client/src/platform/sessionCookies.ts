import type { KeptStorage } from '@ValenceClient/platform/KeptStorage';

/**
 * Storage kept in cookies that end with the browser session, so every tab and window of one sitting
 * shares it and quitting the browser, or the desktop app, forgets it.
 *
 * @param jar - The document whose cookies to use, read at the moment of asking.
 * @returns The storage.
 */
const sessionCookies = (jar: () => { cookie: string }): KeptStorage => ({
  getItem: (key) => {
    const named = `${encodeURIComponent(key)}=`;
    const found = jar()
      .cookie.split('; ')
      .find((one) => one.startsWith(named));

    return found === undefined ? null : decodeURIComponent(found.slice(named.length));
  },
  setItem: (key, value) => {
    jar().cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; SameSite=Strict`;
  },
  removeItem: (key) => {
    jar().cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Strict`;
  },
});

export { sessionCookies };
