import { createServer } from 'node:http';

type Listening = {
  port: number;
  handedBack: Promise<string | null>;
};

const LONG_ENOUGH_TO_SIGN_IN = 10 * 60 * 1000;

const SIGNED_IN = `<!doctype html>
<html lang="en">
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <title>Signed in to Valence</title>
  <body style="margin: 0; min-height: 100vh; display: grid; place-items: center; font: 16px system-ui, sans-serif">
    <p>Signed in. You can close this tab and go back to Valence.</p>
  </body>
</html>
`;

let stopWaiting: (() => void) | null = null;

/**
 * Listens on this machine alone for the browser to hand a sign-in back to the desktop app.
 *
 * A port of its own on the loopback address, for one answer: the first request that brings a code is
 * answered with a page saying so, and the listening stops. Anything else is told there is nothing
 * here. Somebody who closes the tab instead is not waited for for ever, and starting again gives up
 * on the one before.
 *
 * @param waitFor - How long to wait before giving up.
 * @returns The port the browser is to be sent back to, and the code it brings, or nothing where it
 * never came.
 */
const listenForTheHandBack = async (waitFor = LONG_ENOUGH_TO_SIGN_IN): Promise<Listening> => {
  stopWaiting?.();

  const server = createServer();
  let settle: (code: string | null) => void = () => undefined;
  const handedBack = new Promise<string | null>((resolve) => {
    settle = resolve;
  });

  /**
   * Stops listening, and says what came of it.
   *
   * @param code - What was handed back, or nothing.
   */
  const finish = (code: string | null): void => {
    clearTimeout(giveUp);
    server.close();
    stopWaiting = null;
    settle(code);
  };

  server.on('request', (request, response) => {
    const asked = new URL(request.url ?? '/', 'http://127.0.0.1');
    const code = asked.pathname === '/signed-in' ? asked.searchParams.get('code') : null;

    if (code === null || code === '') {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not here.');

      return;
    }

    response
      .writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      .end(SIGNED_IN);
    finish(code);
  });

  const giveUp = setTimeout(() => {
    finish(null);
  }, waitFor);

  stopWaiting = () => {
    finish(null);
  };

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const where = server.address();

  return { port: typeof where === 'object' && where !== null ? where.port : 0, handedBack };
};

export { listenForTheHandBack };
