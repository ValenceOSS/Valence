import { z } from 'zod';
import type { Connect } from '@ValenceClient/realtime/createRealtimeClient';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';
import { theServerThisPhoneWatches } from '@ValencePhone/platform/theServerThisPhoneWatches';

const PATH = '/api/realtime';

const SpokenSchema = z.object({ data: z.string() });

/**
 * Opens the socket to whichever server this phone was told to watch.
 *
 * The address is turned into its websocket twin rather than assumed: a server reached over TLS
 * refuses a plain connection, and one reached over plain HTTP has no TLS to offer, so guessing
 * either way breaks half the installations.
 *
 * @param store - Where the phone keeps which server it watches.
 * @returns How to open the socket.
 */
const thePhonesSocket =
  (store: DeviceStore): Connect =>
  (handlers) => {
    const address = theServerThisPhoneWatches(store) ?? '';
    const socket = new WebSocket(`${address.replace(/^http/, 'ws')}${PATH}`);

    socket.onopen = () => {
      handlers.onOpen();
    };

    socket.onmessage = (event) => {
      const spoken = SpokenSchema.safeParse(event);

      if (spoken.success) {
        handlers.onMessage(spoken.data.data);
      }
    };

    socket.onclose = () => {
      handlers.onClose();
    };

    socket.onerror = () => {
      socket.close();
    };

    return {
      send: (raw) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(raw);
        }
      },
      close: () => {
        socket.close();
      },
    };
  };

export { thePhonesSocket };
