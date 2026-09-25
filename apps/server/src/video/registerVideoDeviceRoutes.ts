import { say } from '@ValenceI18n/say';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { deviceOwnerOf } from '@ValenceServer/devices/deviceOwnerOf';
import {
  commandVideoDeviceRoute,
  listVideoDevicesRoute,
  reportNowWatchingRoute,
} from '@ValenceServer/routes/VideoDeviceRoute';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { VideoDevices } from './createVideoDevices';

type VideoDeviceRouteOptions = {
  viewerOf: (headers: Headers) => Promise<Viewer | null>;
  devices: VideoDevices;
};

/**
 * Serves the list of somebody's devices to send a film to, what each says it is watching, and the
 * commands one device sends another — play this film, pause, move, stop.
 *
 * @param app - The application to add the routes to.
 * @param options - Who is asking, and the devices.
 */
const registerVideoDeviceRoutes = (
  app: OpenAPIHono,
  { viewerOf, devices }: VideoDeviceRouteOptions,
): void => {
  app.openapi(listVideoDevicesRoute, async (context) => {
    const owner = deviceOwnerOf(await viewerOf(context.req.raw.headers));

    if (owner === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json({ devices: devices.list(owner) }, 200);
  });

  app.openapi(reportNowWatchingRoute, async (context) => {
    const owner = deviceOwnerOf(await viewerOf(context.req.raw.headers));

    if (owner === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { clientId, nowWatching } = context.req.valid('json');

    return devices.report(owner, clientId, nowWatching)
      ? context.json({ ok: true }, 200)
      : context.json({ error: say('server.errors.deviceNotConnected') }, 404);
  });

  app.openapi(commandVideoDeviceRoute, async (context) => {
    const owner = deviceOwnerOf(await viewerOf(context.req.raw.headers));

    if (owner === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { fromClientId, command } = context.req.valid('json');
    const sent = devices.command(owner, fromClientId, context.req.valid('param').clientId, command);

    return sent
      ? context.json({ ok: true }, 200)
      : context.json({ error: say('server.errors.deviceNotYours') }, 404);
  });
};

export { registerVideoDeviceRoutes };
