import { allowCrossOriginClients } from '@ValenceServer/auth/allowCrossOriginClients';
import { FEDERATION_PATH } from '@ValenceServer/linking/FEDERATION_PATH';
import { createShareGate } from '@ValenceServer/sharing/createShareGate';
import { createSessionGate } from '@ValenceServer/auth/createSessionGate';
import { createBetterAuthAdminBlock } from '@ValenceServer/auth/createBetterAuthAdminBlock';
import { createOneTimeTokenBlock } from '@ValenceServer/auth/createOneTimeTokenBlock';
import { createNoEmailBlock } from '@ValenceServer/auth/createNoEmailBlock';
import { blockOnTheDemo } from '@ValenceServer/demo/blockOnTheDemo';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers what every request passes through before any endpoint answers it — the headers, the checks on who may reach what, and the sign-in service's own paths.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveEveryRequest = (app: OpenAPIHono, context: AppContext): void => {
  const {
    auth,
    settings,
    trustedOrigins,
    library,
    presence,
    shares,
    shareSessions,
    refuseWhatIsOutOfReach,
    peerRequests,
    linkPeople,
    linkPersonOf,
  } = context;

  app.use('*', async (context, next) => {
    await next();

    context.res.headers.set('Referrer-Policy', 'no-referrer');
    context.res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  });

  app.use(
    '/api/*',
    allowCrossOriginClients({
      trustedOrigins: trustedOrigins ?? (async () => (await settings.read()).trustedOrigins),
      opensToEveryOrigin: (path) => path.startsWith(`${FEDERATION_PATH}/direct/`),
    }),
  );

  app.use(
    '/api/*',
    createSessionGate({
      auth,
      showsFaces: async () => (await settings.read()).showsProfilesBeforeSignIn,
      isPassedThrough: (headers) => peerRequests.has(headers),
      ...(shares === undefined || shareSessions === undefined
        ? {}
        : {
            shareGate: createShareGate({
              shares,
              sessions: shareSessions,
              shareHoldingTab: (clientId) => presence.shareOf(clientId),
              itemOf: async (mediaId) => {
                const item = await library.getMedia(mediaId);

                return item === null
                  ? null
                  : { id: item.id, seriesId: await library.seriesOf(mediaId) };
              },
            }),
          }),
    }),
  );

  app.use('/api/*', refuseWhatIsOutOfReach);

  app.use('/api/*', async (context, next) =>
    linkPeople.runAs(() => linkPersonOf(context.req.raw.headers), next),
  );

  blockOnTheDemo(app, context.isOnTheDemo);

  app.all('/api/auth/admin/*', createBetterAuthAdminBlock());

  app.all('/api/auth/one-time-token/*', createOneTimeTokenBlock());

  app.use('/api/auth/*', createNoEmailBlock());

  app.on(['GET', 'POST'], '/api/auth/*', (context) => auth.handler(context.req.raw));
};

export { serveEveryRequest };
