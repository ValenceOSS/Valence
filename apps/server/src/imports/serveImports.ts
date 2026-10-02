import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { CreateAppOptions } from '@ValenceServer/api/CreateAppOptions';
import { linkOriginOf } from '@ValenceServer/accounts/setupLinks/linkOriginOf';
import { registerImportRoutes } from './registerImportRoutes';

/**
 * Registers the endpoints that bring everything across from Jellyfin, Emby or Plex, which refuse
 * when the server was built without an importer.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 * @param options - What the server was built with, for its importer.
 */
const serveImports = (
  app: OpenAPIHono,
  context: Pick<AppContext, 'requires' | 'readAccount' | 'trustedOrigins'>,
  options: Pick<CreateAppOptions, 'imports'>,
): void => {
  registerImportRoutes(app, {
    imports: options.imports,
    requires: context.requires,
    accountOf: async (headers) => (await context.readAccount(headers))?.id ?? null,
    originOf: async (headers) => linkOriginOf(headers, (await context.trustedOrigins?.()) ?? []),
  });
};

export { serveImports };
