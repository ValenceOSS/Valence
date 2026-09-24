import { OpenAPIHono } from '@hono/zod-openapi';
import { createAppContext } from '@ValenceServer/api/createAppContext';
import { serveEveryRequest } from '@ValenceServer/api/serveEveryRequest';
import { serveAbout } from '@ValenceServer/api/serveAbout';
import { serveSetup } from '@ValenceServer/api/serveSetup';
import { serveLibrary } from '@ValenceServer/api/serveLibrary';
import { serveFiles } from '@ValenceServer/api/serveFiles';
import { serveFolder } from '@ValenceServer/api/serveFolder';
import { serveUpload } from '@ValenceServer/api/serveUpload';
import { serveAdmin } from '@ValenceServer/api/serveAdmin';
import { serveHealth } from '@ValenceServer/api/serveHealth';
import { servePlayback } from '@ValenceServer/api/servePlayback';
import { serveApiKey } from '@ValenceServer/api/serveApiKey';
import { serveWebhook } from '@ValenceServer/api/serveWebhook';
import { serveNotification } from '@ValenceServer/api/serveNotification';
import { serveProfile } from '@ValenceServer/api/serveProfile';
import { serveHousehold } from '@ValenceServer/api/serveHousehold';
import { serveRole } from '@ValenceServer/api/serveRole';
import { serveLibraryAccess } from '@ValenceServer/api/serveLibraryAccess';
import { serveAccount } from '@ValenceServer/api/serveAccount';
import { serveRequests } from '@ValenceServer/api/serveRequests';
import { serveSamples } from '@ValenceServer/api/serveSamples';
import { servePermission } from '@ValenceServer/api/servePermission';
import { serveDevice } from '@ValenceServer/api/serveDevice';
import { serveProgress } from '@ValenceServer/api/serveProgress';
import { serveHistory } from '@ValenceServer/api/serveHistory';
import { servePerson } from '@ValenceServer/api/servePerson';
import { serveFavourite } from '@ValenceServer/api/serveFavourite';
import { serveHidden } from '@ValenceServer/api/serveHidden';
import { serveShare } from '@ValenceServer/api/serveShare';
import { serveRating } from '@ValenceServer/api/serveRating';
import { serveSegment } from '@ValenceServer/api/serveSegment';
import { serveBook } from '@ValenceServer/api/serveBook';
import { serveImage } from '@ValenceServer/api/serveImage';
import { serveSubtitle } from '@ValenceServer/api/serveSubtitle';
import { servePresence } from '@ValenceServer/api/servePresence';
import { servePhone } from '@ValenceServer/api/servePhone';
import { serveReference } from '@ValenceServer/api/serveReference';
import type { CreateAppOptions } from '@ValenceServer/api/CreateAppOptions';

/**
 * Builds the server's API: every endpoint, registered area by area in the order they are matched,
 * over one context made from what the server was built with.
 *
 * @param options - The services and settings the server runs with.
 * @returns The application, ready to serve.
 */
const createApp = (options: CreateAppOptions) => {
  const app = new OpenAPIHono();
  const context = createAppContext(options, app);

  serveEveryRequest(app, context);
  serveAbout(app);
  serveSetup(app, context);
  serveLibrary(app, context);
  serveFiles(app, context);
  serveFolder(app, context);
  serveUpload(app, context);
  serveAdmin(app, context);
  serveHealth(app, context);
  servePlayback(app, context);
  serveApiKey(app, context);
  serveWebhook(app, context);
  serveNotification(app, context);
  serveProfile(app, context);
  serveHousehold(app, context);
  serveRole(app, context);
  serveLibraryAccess(app, context);
  serveAccount(app, context);
  serveRequests(app, context);
  serveSamples(app, context);
  servePermission(app, context);
  serveDevice(app, context);
  serveProgress(app, context);
  serveHistory(app, context);
  servePerson(app, context);
  serveFavourite(app, context);
  serveHidden(app, context);
  serveShare(app, context);
  serveRating(app, context);
  serveSegment(app, context);
  serveBook(app, context);
  serveImage(app, context);
  serveSubtitle(app, context);
  servePresence(app, context);
  servePhone(app, context);
  serveReference(app, context);

  return app;
};

export { createApp };
