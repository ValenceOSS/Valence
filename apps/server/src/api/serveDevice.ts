import {
  listDevicesRoute,
  endDeviceRoute,
  endOtherDevicesRoute,
  renameDeviceRoute,
  askingDeviceRoute,
} from '@ValenceServer/routes/DeviceRoute';
import { nameTheClient } from '@ValenceCore/functions/nameTheClient';
import { nameTheDevice } from '@ValenceCore/functions/nameTheDevice';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import { readDevicesOf } from '@ValenceServer/devices/readDevicesOf';
import { shownDevice } from '@ValenceServer/devices/shownDevice';
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
  const { auth, monitor, requires, isOnTheDemo, deviceNotes, askingDevices, presence } = context;

  /**
   * The devices the account asking is signed in on, and the session it is asking from.
   *
   * @param headers - The request's headers.
   * @returns The devices, or nothing where nobody is signed in.
   */
  const devicesOfWhoeverAsks = async (headers: Headers) => {
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return null;
    }

    const devices = await readDevicesOf({
      userId: session.user.id,
      currentSessionId: session.session.id,
      notes: deviceNotes,
      heldWithoutNotes: async () =>
        (await auth.api.listSessions({ headers }).catch(() => [])).map((one) => ({
          id: one.id,
          deviceId: null,
          device: null,
          userAgent: one.userAgent ?? null,
          ipAddress: one.ipAddress ?? null,
          createdAt: one.createdAt,
          lastActiveAt: null,
          expiresAt: one.expiresAt,
        })),
      presence,
      now: new Date(),
    });

    return { session, devices };
  };

  /**
   * Signs out every sign-in a device holds.
   *
   * @param headers - The request's headers, whose session is used where the server keeps no notes.
   * @param userId - Whose device it is.
   * @param sessionIds - The device's sign-ins.
   */
  const signOut = async (headers: Headers, userId: string, sessionIds: readonly string[]) => {
    if (deviceNotes !== undefined) {
      await deviceNotes.end(userId, sessionIds);

      return;
    }

    const held = await auth.api.listSessions({ headers }).catch(() => []);

    await Promise.all(
      held
        .filter((one) => sessionIds.includes(one.id))
        .map((one) =>
          auth.api.revokeSession({ headers, body: { token: one.token } }).catch(() => undefined),
        ),
    );
  };

  app.openapi(listDevicesRoute, async (context) => {
    const headers = context.req.raw.headers;
    const read = await devicesOfWhoeverAsks(headers);

    if (read === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const held = (await isOnTheDemo(headers))
      ? read.devices.filter((device) => device.isCurrent)
      : read.devices;

    return context.json({ devices: held.map(shownDevice) }, 200);
  });

  app.openapi(endDeviceRoute, async (context) => {
    const headers = context.req.raw.headers;
    const read = await devicesOfWhoeverAsks(headers);

    if (read === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const asked = context.req.valid('param').id;
    const device = read.devices.find((one) => one.sessionIds.includes(asked));

    if (device !== undefined) {
      await signOut(headers, read.session.user.id, device.sessionIds);
    }

    return context.body(null, 204);
  });

  app.openapi(renameDeviceRoute, async (context) => {
    const read = await devicesOfWhoeverAsks(context.req.raw.headers);

    if (read === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const asked = context.req.valid('param').id;
    const device = read.devices.find((one) => one.sessionIds.includes(asked));

    if (device === undefined || deviceNotes === undefined) {
      return context.json(refuse('error.device.noSuchDevice'), 404);
    }

    const given = context.req.valid('json').name;
    const name = given === null || given === '' ? null : given;
    const userId = read.session.user.id;

    await deviceNotes.rename(userId, device.key, name);

    presence.renameDevice(userId, device.key, name);

    return context.body(null, 204);
  });

  app.openapi(askingDeviceRoute, async (context) => {
    const session = await readSessionOnce(auth, context.req.raw.headers);

    if (session === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const asking = askingDevices?.read(context.req.valid('param').userCode) ?? null;

    if (asking === null) {
      return context.json(refuse('error.device.noSuchDevice'), 404);
    }

    return context.json(
      {
        device: nameTheDevice(asking.identity),
        client: nameTheClient(asking.identity),
        address: asking.address,
      },
      200,
    );
  });

  app.openapi(endOtherDevicesRoute, async (context) => {
    const headers = context.req.raw.headers;
    const read = await devicesOfWhoeverAsks(headers);

    if (read === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const thisSignIn = read.session.session.id;

    await signOut(
      headers,
      read.session.user.id,
      read.devices.flatMap((device) => device.sessionIds).filter((one) => one !== thisSignIn),
    );

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
