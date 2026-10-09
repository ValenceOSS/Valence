import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { serveStatic } from '@hono/node-server/serve-static';
import { isAppAddress } from '@ValenceServer/web/isAppAddress';
import { LAYOUT_COOKIE } from '@ValenceCore/functions/LAYOUT_COOKIE';
import { LAYOUT_COOKIE_SECONDS } from '@ValenceCore/functions/LAYOUT_COOKIE_SECONDS';
import { layoutFor } from '@ValenceServer/web/layoutFor';

const PREFIX = '/tv';

/**
 * Serves the TV layout to a television's browser at the same addresses as the web app, so nobody
 * has to type anything different on a television: its page wherever the web app's would be, and its
 * own files from beneath `/tv`. Answers vary by browser and by the layout somebody chose, so a cache
 * between the two never hands one to the other. Where this server was built without the TV layout,
 * every browser is shown the web app.
 *
 * Its files are sent compressed where the build left a compressed copy beside them and the browser
 * takes one, since a television downloads its whole bundle of script before it draws anything.
 *
 * `?layout=tv` or `?layout=web` on any page chooses the layout as the button in each does, so a
 * television left on a layout that will not draw can be brought back by typing an address.
 *
 * @param root - Where the TV layout's built files are.
 * @returns The middleware.
 */
const serveTheTvLayout = (root: string) => {
  const page = join(root, 'index.html');
  const files = serveStatic({
    root,
    precompressed: true,
    rewriteRequestPath: (path) => path.slice(PREFIX.length) || '/',
  });

  return createMiddleware(async (context, next) => {
    if (!existsSync(page)) {
      await next();

      return;
    }

    const { path } = context.req;

    if (path.startsWith(`${PREFIX}/`)) {
      return files(context, next);
    }

    const isPage = context.req.method === 'GET' && (path === '/' || isAppAddress(path));

    if (!isPage) {
      await next();

      return;
    }

    context.header('Vary', 'User-Agent, Cookie');

    const asked = context.req.query('layout');

    if (asked === 'tv' || asked === 'web') {
      setCookie(context, LAYOUT_COOKIE, asked, {
        path: '/',
        maxAge: LAYOUT_COOKIE_SECONDS,
        sameSite: 'Lax',
      });
    }

    const chosen = asked === 'tv' || asked === 'web' ? asked : getCookie(context, LAYOUT_COOKIE);

    if (layoutFor(context.req.header('user-agent'), chosen) === 'tv') {
      return serveStatic({ path: page })(context, next);
    }

    await next();
  });
};

export { serveTheTvLayout };
