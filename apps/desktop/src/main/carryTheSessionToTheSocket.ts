import { session } from 'electron';
import { theServerAddress } from '@ValenceDesktop/main/theServerAddress';
import {
  isAVideoHost,
  nameValenceToTheVideoHost,
} from '@ValenceDesktop/main/nameValenceToTheVideoHost';

const WATCHED = {
  urls: ['ws://*/*', 'wss://*/*', 'https://*.youtube-nocookie.com/*', 'https://*.youtube.com/*'],
};

/**
 * Puts the session on the live connection, which is the one request that cannot be passed on.
 *
 * Everything else this client asks of a server goes out through the process that owns the window,
 * where cookies are simply attached. A socket cannot: it is opened by the page, at the server, and
 * the page's own origin is this client rather than the server — so the browser treats the cookie as
 * somebody else's and sends nothing. The server then does the right thing and refuses a connection
 * with no credentials, which is what "no valid credentials available" is.
 *
 * A handshake is still an ordinary request as far as the network stack is concerned, so the cookie
 * the session already holds is put on it here, on the way out. Only for the server this client
 * watches: a socket to anywhere else is none of our business and gets nothing.
 *
 * A trailer framed from a video host is dressed here too, for the plain reason that a session takes
 * one listener for what goes out and a second would quietly replace the first.
 */
const carryTheSessionToTheSocket = (): void => {
  session.defaultSession.webRequest.onBeforeSendHeaders(WATCHED, (details, respond) => {
    if (isAVideoHost(details.url)) {
      respond({ requestHeaders: nameValenceToTheVideoHost(details.requestHeaders) });

      return;
    }

    const server = theServerAddress();

    if (server === '') {
      respond({ requestHeaders: details.requestHeaders });

      return;
    }

    const asked = URL.parse(details.url);
    const watched = URL.parse(server);

    if (asked === null || watched === null || asked.host !== watched.host) {
      respond({ requestHeaders: details.requestHeaders });

      return;
    }

    void session.defaultSession.cookies
      .get({ url: server })
      .then((held) => {
        const carried = held.map((one) => `${one.name}=${one.value}`).join('; ');

        respond({
          requestHeaders:
            carried === ''
              ? details.requestHeaders
              : { ...details.requestHeaders, Cookie: carried },
        });
      })
      .catch(() => {
        respond({ requestHeaders: details.requestHeaders });
      });
  });
};

export { carryTheSessionToTheSocket };
