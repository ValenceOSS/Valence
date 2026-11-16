import { serverAddress } from '@ValenceClient/session/serverAddress';
import type { Connect } from '@ValenceClient/realtime/createRealtimeClient';

const PATH = '/api/realtime';

/**
 * Opens the live connection to whichever Valence this client watches, through the window's own
 * host, which carries the session to the server and passes every frame through.
 *
 * @param handlers - What to call as the connection opens, speaks and ends.
 * @returns The link the client drives.
 */
const theDesktopsSocket: Connect = (handlers) => {
  if (serverAddress() === null) {
    return { send: () => {}, close: () => {} };
  }

  const address = new URL(PATH, window.location.href);

  address.protocol = address.protocol.replace('http', 'ws');

  const socket = new WebSocket(address);

  socket.onopen = () => {
    handlers.onOpen();
  };

  socket.onmessage = (event: MessageEvent<string>) => {
    handlers.onMessage(event.data);
  };

  socket.onclose = () => {
    handlers.onClose();
  };

  socket.onerror = () => {
    socket.close();
  };

  return {
    send: (message: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    },
    close: () => {
      socket.close();
    },
  };
};

export { theDesktopsSocket };
