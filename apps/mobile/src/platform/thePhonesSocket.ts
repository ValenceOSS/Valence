import { z } from 'zod';
import type { Connect } from '@ValenceClient/realtime/createRealtimeClient';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';
import { theServerThisPhoneWatches } from '@ValenceMobile/platform/theServerThisPhoneWatches';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';

const PATH = '/api/realtime';

const SpokenSchema = z.object({ data: z.string() });

/**
 * Opens the socket to whichever server this phone was told to watch.
 *
 * The address is turned into its websocket twin rather than assumed: a server reached over TLS
 * refuses a plain connection, and one reached over plain HTTP has no TLS to offer, so guessing
 * either way breaks half the installations.
 *
 * It is opened with this phone's session on it. A socket built here does not consult the jar the
 * system keeps, so without this the server is asked to open a realtime connection by nobody it
 * recognises — and presence, which is that connection, never learns this phone exists.
 *
 * Reading the jar is asking the system a question, so the socket is built once it has answered.
 * Whoever opened it is handed something to send on immediately, and anything said before there is
 * a socket to say it on is dropped, as it is on any connection that has not opened yet.
 *
 * @param store - Where the phone keeps which server it watches.
 * @returns How to open the socket.
 */
const thePhonesSocket =
  (store: DeviceStore): Connect =>
  (handlers) => {
    const address = theServerThisPhoneWatches(store) ?? '';
    let socket: WebSocket | null = null;
    let closedBeforeItOpened = false;

    void theCookiesThisPhoneHolds(address).then((cookie) => {
      if (closedBeforeItOpened) {
        return;
      }

      const opened = new WebSocket(
        `${address.replace(/^http/u, 'ws')}${PATH}`,
        undefined,
        cookie === null ? undefined : { headers: { Cookie: cookie } },
      );

      socket = opened;

      opened.onopen = () => {
        handlers.onOpen();
      };

      opened.onmessage = (event) => {
        const spoken = SpokenSchema.safeParse(event);

        if (spoken.success) {
          handlers.onMessage(spoken.data.data);
        }
      };

      opened.onclose = () => {
        handlers.onClose();
      };

      opened.onerror = () => {
        opened.close();
      };
    });

    return {
      send: (raw) => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(raw);
        }
      },
      close: () => {
        closedBeforeItOpened = true;
        socket?.close();
      },
    };
  };

export { thePhonesSocket };
