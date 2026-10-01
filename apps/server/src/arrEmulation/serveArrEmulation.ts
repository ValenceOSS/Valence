import { arrEmulationOf } from '@ValenceServer/arrEmulation/arrEmulationOf';
import { registerRadarrEmulation } from '@ValenceServer/arrEmulation/registerRadarrEmulation';
import { registerSeerrLinkRoutes } from '@ValenceServer/arrEmulation/registerSeerrLinkRoutes';
import { registerSonarrEmulation } from '@ValenceServer/arrEmulation/registerSonarrEmulation';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { CreateAppOptions } from '@ValenceServer/api/CreateAppOptions';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers Valence standing in for Radarr and Sonarr, so that Overseerr or Jellyseerr can send it
 * what people ask for there, and the endpoints whoever manages requesting sets that up with.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 * @param options - What the server was built with, for finding a series by its TVDB id.
 */
const serveArrEmulation = (
  app: OpenAPIHono,
  context: AppContext,
  options: Pick<CreateAppOptions, 'seriesOfTvdbId'>,
): void => {
  const { seriesOfTvdbId = () => Promise.resolve(null) } = options;
  const emulation = arrEmulationOf(context, seriesOfTvdbId);

  registerSeerrLinkRoutes(app, {
    settings: context.settings,
    mayManage: (headers) => context.requires(headers, 'requests.manage'),
    isRequestingOn: context.requestsClient !== null,
    accountExists: async (accountId) =>
      ((await context.listUsers?.()) ?? []).some((account) => account.id === accountId),
  });
  registerRadarrEmulation(app, emulation);
  registerSonarrEmulation(app, emulation);
};

export { serveArrEmulation };
