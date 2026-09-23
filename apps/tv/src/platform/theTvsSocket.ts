import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import { theServersOrigin } from '@ValenceTv/platform/theServersOrigin';
import type { Connect } from '@ValenceClient/realtime/createRealtimeClient';

const PATH = '/api/realtime';

type HeaderedSocket = new (
  uri: string,
  protocols: undefined,
  options: { headers: Record<string, string> },
) => WebSocket;

const Socket: HeaderedSocket = WebSocket;

/**
 * Opens the live connection to whichever Valence this television watches.
 *
 * React Native's `WebSocket` is the platform's own, so nothing here depends on a document. What it
 * lacks is a page to take an address from and a cookie to be recognised by — so the origin is asked
 * for, the scheme follows the server's, and the session goes as a header on the upgrade. React
 * Native's constructor takes those headers as a third argument, which the browser's own type, loaded
 * beside it for the code this client shares with the web, has no room for.
 *
 * @param handlers - What to call as the connection opens, speaks and ends.
 * @returns The link the client drives.
 */
const theTvsSocket: Connect = (handlers) => {
  const origin = theServersOrigin();

  if (origin === null) {
    handlers.onClose();

    return { send: () => undefined, close: () => undefined };
  }

  const server = new URL(origin);
  const scheme = server.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new Socket(`${scheme}//${server.host}${PATH}`, undefined, {
    headers: signedHeaders(),
  });

  socket.onopen = () => {
    handlers.onOpen();
  };

  socket.onmessage = (event) => {
    if (typeof event.data === 'string') {
      handlers.onMessage(event.data);
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

export { theTvsSocket };
