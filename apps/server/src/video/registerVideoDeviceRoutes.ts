import type { OpenAPIHono } from '@hono/zod-openapi';
import { deviceOwnerOf } from '@ValenceServer/devices/deviceOwnerOf';
import {
  commandVideoDeviceRoute,
  listVideoDevicesRoute,
  reportNowWatchingRoute,
} from '@ValenceServer/routes/VideoDeviceRoute';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { VideoDevices } from './createVideoDevices';
import { refuse } from '@ValenceI18n/refuse';

type VideoDeviceRouteOptions = {
  viewerOf: (headers: Headers) => Promise<Viewer | null>;
  devices: VideoDevices;
};

const NOBODY = refuse('error.common.nobodyIsSignedIn');

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
      return context.json(NOBODY, 401);
    }

    return context.json({ devices: devices.list(owner) }, 200);
  });

  app.openapi(reportNowWatchingRoute, async (context) => {
    const owner = deviceOwnerOf(await viewerOf(context.req.raw.headers));

    if (owner === null) {
      return context.json(NOBODY, 401);
    }

    const { clientId, nowWatching } = context.req.valid('json');

    return devices.report(owner, clientId, nowWatching)
      ? context.json({ ok: true }, 200)
      : context.json(refuse('error.common.thatDeviceIsNotConnected'), 404);
  });

  app.openapi(commandVideoDeviceRoute, async (context) => {
    const owner = deviceOwnerOf(await viewerOf(context.req.raw.headers));

    if (owner === null) {
      return context.json(NOBODY, 401);
    }

    const { fromClientId, command } = context.req.valid('json');
    const sent = devices.command(owner, fromClientId, context.req.valid('param').clientId, command);

    return sent
      ? context.json({ ok: true }, 200)
      : context.json(refuse('error.common.thatDeviceIsNotOneOf'), 404);
  });
};

export { registerVideoDeviceRoutes };
