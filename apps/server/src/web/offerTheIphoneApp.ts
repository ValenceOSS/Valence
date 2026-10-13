import { createMiddleware } from 'hono/factory';
import { linkIntoTheApp } from '@ValenceCore/functions/linkIntoTheApp';
import { askedOriginOf } from '@ValenceServer/web/askedOriginOf';
import { isAppAddress } from '@ValenceServer/web/isAppAddress';
import { withTheAppStoreBanner } from '@ValenceServer/web/withTheAppStoreBanner';

/**
 * Has Safari on an iPhone offer the Valence app above every page of the web app, through Apple's
 * own banner: Open where the app is installed, which takes it to this server and, on the page that
 * approves a television, to that television's code; Get where it is not, which a link of the app's
 * own cannot offer. The page is answered as it would have been, with the banner's tag added, and
 * nothing is offered where no listing is set or the page was sent compressed.
 *
 * @param appStoreId - The app's App Store listing, or empty for none.
 * @returns The middleware.
 */
const offerTheIphoneApp = (appStoreId: string) =>
  createMiddleware(async (context, next) => {
    await next();

    const { path } = context.req;
    const type = context.res.headers.get('content-type') ?? '';

    if (
      appStoreId === '' ||
      context.req.method !== 'GET' ||
      !(path === '/' || isAppAddress(path)) ||
      !type.startsWith('text/html') ||
      context.res.headers.has('content-encoding')
    ) {
      return;
    }

    const link = linkIntoTheApp(
      { televisionCode: path === '/device' ? (context.req.query('user_code') ?? null) : null },
      askedOriginOf(context.req.url, context.req.raw.headers),
    );
    const page = withTheAppStoreBanner(await context.res.text(), appStoreId, link);
    const headers = new Headers(context.res.headers);

    headers.delete('content-length');
    context.res = new Response(page, { status: context.res.status, headers });
  });

export { offerTheIphoneApp };
