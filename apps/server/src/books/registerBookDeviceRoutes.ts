import { deviceOwnerOf } from '@ValenceServer/devices/deviceOwnerOf';
import {
  reportNowListeningRoute,
  reportNowReadingRoute,
} from '@ValenceServer/routes/BookDeviceRoute';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { BookDevices } from './createBookDevices';
import { refuse } from '@ValenceI18n/refuse';

type BookDeviceRouteOptions = {
  devices: BookDevices;
  viewerOf: (headers: Headers) => Promise<Viewer | null>;
};

const NOBODY = refuse('error.common.nobodyIsSignedIn');

const NOT_CONNECTED = refuse('error.common.thatDeviceIsNotConnected');

/**
 * Hears what each device is doing with a book — the audiobook it is playing or the book it has open
 * — from a device of the person saying so, and from nobody else.
 *
 * @param app - The application to add the routes to.
 * @param options - Where the reports are kept, and who is asking.
 */
const registerBookDeviceRoutes = (
  app: OpenAPIHono,
  { devices, viewerOf }: BookDeviceRouteOptions,
): void => {
  app.openapi(reportNowListeningRoute, async (context) => {
    const owner = deviceOwnerOf(await viewerOf(context.req.raw.headers));

    if (owner === null) {
      return context.json(NOBODY, 401);
    }

    const { clientId, nowListening } = context.req.valid('json');

    return devices.reportListening(owner, clientId, nowListening)
      ? context.json({ ok: true }, 200)
      : context.json(NOT_CONNECTED, 404);
  });

  app.openapi(reportNowReadingRoute, async (context) => {
    const owner = deviceOwnerOf(await viewerOf(context.req.raw.headers));

    if (owner === null) {
      return context.json(NOBODY, 401);
    }

    const { clientId, nowReading } = context.req.valid('json');

    return devices.reportReading(owner, clientId, nowReading)
      ? context.json({ ok: true }, 200)
      : context.json(NOT_CONNECTED, 404);
  });
};

export { registerBookDeviceRoutes };
