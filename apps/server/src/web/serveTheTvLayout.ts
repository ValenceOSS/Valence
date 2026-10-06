import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { serveStatic } from '@hono/node-server/serve-static';
import { isAppAddress } from '@ValenceServer/web/isAppAddress';
import { LAYOUT_COOKIE } from '@ValenceServer/web/LAYOUT_COOKIE';
import { layoutFor } from '@ValenceServer/web/layoutFor';

const PREFIX = '/tv';

/**
 * Serves the TV layout to a television's browser at the same addresses as the web app, so nobody
 * has to type anything different on a television: its page wherever the web app's would be, and its
 * own files from beneath `/tv`. Answers vary by browser and by the layout somebody chose, so a cache
 * between the two never hands one to the other. Where this server was built without the TV layout,
 * every browser is shown the web app.
 *
 * @param root - Where the TV layout's built files are.
 * @returns The middleware.
 */
const serveTheTvLayout = (root: string) => {
  const page = join(root, 'index.html');
  const files = serveStatic({
    root,
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

    if (layoutFor(context.req.header('user-agent'), getCookie(context, LAYOUT_COOKIE)) === 'tv') {
      return serveStatic({ path: page })(context, next);
    }

    await next();
  });
};

export { serveTheTvLayout };
