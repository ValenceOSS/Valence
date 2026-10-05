import {
  listDevicesRoute,
  endDeviceRoute,
  endOtherDevicesRoute,
} from '@ValenceServer/routes/DeviceRoute';
import { describeDevice } from '@ValenceServer/account/describeDevice';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the device endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveDevice = (app: OpenAPIHono, context: AppContext): void => {
  const { auth, monitor, requires, isOnTheDemo } = context;

  app.openapi(listDevicesRoute, async (context) => {
    const headers = context.req.raw.headers;
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const listed = await auth.api.listSessions({ headers }).catch(() => []);
    const held = (await isOnTheDemo(headers))
      ? listed.filter((one) => one.token === session.session.token)
      : listed;

    return context.json(
      {
        devices: held.map((one) => ({
          id: one.id,
          name: describeDevice(one.userAgent),
          address: one.ipAddress ?? null,
          signedInAt: one.createdAt.toISOString(),
          expiresAt: one.expiresAt.toISOString(),
          isCurrent: one.token === session.session.token,
        })),
      },
      200,
    );
  });

  app.openapi(endDeviceRoute, async (context) => {
    const headers = context.req.raw.headers;
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const held = await auth.api.listSessions({ headers }).catch(() => []);
    const asked = held.find((one) => one.id === context.req.valid('param').id);

    if (asked !== undefined) {
      await auth.api
        .revokeSession({ headers, body: { token: asked.token } })
        .catch(() => undefined);
    }

    return context.body(null, 204);
  });

  app.openapi(endOtherDevicesRoute, async (context) => {
    const headers = context.req.raw.headers;
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await auth.api.revokeOtherSessions({ headers }).catch(() => undefined);

    return context.body(null, 204);
  });

  app.get('/api/admin/monitor', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.monitor'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const reading = await monitor?.().catch(() => null);

    if (reading === null || reading === undefined) {
      return context.json(refuse('error.device.theMediaServiceDidNotAnswer'), 503);
    }

    return new Response(JSON.stringify(reading), {
      headers: { 'content-type': 'application/json' },
    });
  });
};

export { serveDevice };
