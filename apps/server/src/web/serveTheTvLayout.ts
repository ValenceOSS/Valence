import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { serveStatic } from '@hono/node-server/serve-static';
import { isAppAddress } from '@ValenceServer/web/isAppAddress';
import { LAYOUT_COOKIE } from '@ValenceCore/functions/LAYOUT_COOKIE';
import { LAYOUT_COOKIE_SECONDS } from '@ValenceCore/functions/LAYOUT_COOKIE_SECONDS';
import { LAYOUT_KEPT_COOKIE } from '@ValenceCore/functions/LAYOUT_KEPT_COOKIE';
import { LAYOUT_ON_TRIAL_COOKIE } from '@ValenceCore/functions/LAYOUT_ON_TRIAL_COOKIE';
import { layoutFor } from '@ValenceServer/web/layoutFor';
import { isATvBrowser } from '@ValenceServer/web/isATvBrowser';
import { withAWayBackToTheTvLayout } from '@ValenceServer/web/withAWayBackToTheTvLayout';

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
 * A television's browser sent the web app because somebody chose it there gets a way back in the page
 * that does not need the web app to run, since some televisions draw it as a white page with no way
 * out: it goes back to the TV layout unless somebody keeps the web app, which is then remembered.
 * So does any browser that chose the web app from the TV layout's own button, which marks it on
 * trial, since a television's browser does not always say it is one.
 * Choosing a layout by address forgets that, so the next time the web app is chosen it is asked
 * again.
 *
 * `?layout=tv` or `?layout=web` on any page chooses the layout as the button in each does, so a
 * television left on a layout that will not draw can be brought back by typing an address. The
 * choice is kept and the page is sent on to the same address without it, so the address bar does
 * not go on asking: reloading it after choosing the other layout with the button would otherwise
 * choose this one again.
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
      deleteCookie(context, LAYOUT_KEPT_COOKIE, { path: '/' });

      const without = new URL(context.req.url);

      without.searchParams.delete('layout');

      return context.redirect(`${without.pathname}${without.search}`, 302);
    }

    const chosen = getCookie(context, LAYOUT_COOKIE);

    const userAgent = context.req.header('user-agent');

    if (layoutFor(userAgent, chosen) === 'tv') {
      return serveStatic({ path: page })(context, next);
    }

    await next();

    const type = context.res.headers.get('content-type') ?? '';

    const isOnTrial =
      chosen === 'web' &&
      getCookie(context, LAYOUT_KEPT_COOKIE) === undefined &&
      (isATvBrowser(userAgent) || getCookie(context, LAYOUT_ON_TRIAL_COOKIE) !== undefined);

    if (isOnTrial && type.startsWith('text/html')) {
      const answered = withAWayBackToTheTvLayout(await context.res.text());
      const { status } = context.res;

      context.res.headers.delete('content-length');
      context.res = new Response(answered, { status, headers: { 'content-type': type } });
    }
  });
};

export { serveTheTvLayout };
