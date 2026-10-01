import { randomBytes } from 'node:crypto';
import { refuse } from '@ValenceI18n/refuse';
import {
  changeSeerrLinkRoute,
  readSeerrLinkRoute,
  rotateSeerrKeyRoute,
} from '@ValenceServer/routes/SeerrRoute';
import { SEERR_RADARR_PATH, SEERR_SONARR_PATH } from '@ValenceContracts/schemas/SeerrLink';
import type { SeerrLink, SeerrSettings } from '@ValenceContracts/schemas/SeerrLink';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
import type { OpenAPIHono } from '@hono/zod-openapi';

const KEY_BYTES = 16;

type SeerrLinkDependencies = {
  settings: SettingsStore;
  mayManage: (headers: Headers) => Promise<boolean>;
  isRequestingOn: boolean;
  accountExists: (accountId: string) => Promise<boolean>;
};

/**
 * Makes a key for Overseerr or Jellyseerr to send, shaped like the keys Radarr and Sonarr make.
 *
 * @returns Thirty-two hexadecimal characters.
 */
const makeSeerrKey = (): string => randomBytes(KEY_BYTES).toString('hex');

/**
 * Registers the endpoints whoever manages requesting turns the Radarr and Sonarr stand-in on with,
 * makes its key and chooses whose name its requests are made in.
 *
 * @param app - The application to register them on.
 * @param dependencies - The settings it is kept in, and who may change it.
 */
const registerSeerrLinkRoutes = (app: OpenAPIHono, dependencies: SeerrLinkDependencies): void => {
  const { settings, mayManage, isRequestingOn, accountExists } = dependencies;

  const linkOf = (seerr: SeerrSettings): SeerrLink => ({
    ...seerr,
    isRequestingOn,
    radarrPath: SEERR_RADARR_PATH,
    sonarrPath: SEERR_SONARR_PATH,
  });

  app.openapi(readSeerrLinkRoute, async (context) => {
    if (!(await mayManage(context.req.raw.headers))) {
      return context.json(refuse('error.common.thatIsForWhoeverSetsUp'), 403);
    }

    return context.json(linkOf((await settings.read()).seerr), 200);
  });

  app.openapi(changeSeerrLinkRoute, async (context) => {
    if (!(await mayManage(context.req.raw.headers))) {
      return context.json(refuse('error.common.thatIsForWhoeverSetsUp'), 403);
    }

    const { isEnabled, accountId } = context.req.valid('json');

    if (accountId !== '' && !(await accountExists(accountId))) {
      return context.json(refuse('error.account.noSuchAccount'), 400);
    }

    const { seerr } = await settings.read();
    const saved = await settings.write({
      seerr: {
        isEnabled,
        accountId,
        apiKey: seerr.apiKey === '' && isEnabled ? makeSeerrKey() : seerr.apiKey,
      },
    });

    return context.json(linkOf(saved.seerr), 200);
  });

  app.openapi(rotateSeerrKeyRoute, async (context) => {
    if (!(await mayManage(context.req.raw.headers))) {
      return context.json(refuse('error.common.thatIsForWhoeverSetsUp'), 403);
    }

    const { seerr } = await settings.read();
    const saved = await settings.write({ seerr: { ...seerr, apiKey: makeSeerrKey() } });

    return context.json(linkOf(saved.seerr), 200);
  });
};

export { registerSeerrLinkRoutes };

export type { SeerrLinkDependencies };
