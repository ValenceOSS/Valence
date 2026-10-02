import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import { refuse } from '@ValenceI18n/refuse';
import { refuseWith } from '@ValenceI18n/refuseWith';
import {
  cancelImportRoute,
  connectImportRoute,
  createImportLibrariesRoute,
  forgetImportRoute,
  importLibrariesRoute,
  importMappingsRoute,
  importPeopleRoute,
  importPinRoute,
  importSetupLinksRoute,
  importStatusRoute,
  linkImportLibraryRoute,
  planImportRoute,
  readImportRoute,
  startImportRoute,
} from '@ValenceServer/routes/ImportRoute';
import type { ImportService } from './createImportService';

type ImportRouteOptions = {
  imports: ImportService | undefined;
  requires: (headers: Headers, permission: Permission) => Promise<boolean>;
  accountOf: (headers: Headers) => Promise<string | null>;
  originOf: (headers: Headers) => Promise<string | undefined>;
};

const MAY_NOT = refuse('common.thatIsForAdministrators');

const NO_SOURCE = refuse('error.imports.noSuchSource');

const NO_RUN = refuse('error.imports.noSuchImport');

const UNAVAILABLE = refuse('error.imports.thisServerCannotImport');

/**
 * Puts bringing everything across from Jellyfin, Emby or Plex on the API, every route behind full
 * administration because an import makes accounts, including administrators.
 *
 * @param app - The application to register on.
 * @param options - The import service, how to check a permission, who is asking, and the address
 *   their setup links should open on.
 */
const registerImportRoutes = (
  app: OpenAPIHono,
  { imports, requires, accountOf, originOf }: ImportRouteOptions,
): void => {
  const gate = async (headers: Headers): Promise<ImportService | 'mayNot' | 'unavailable'> => {
    if (!(await requires(headers, 'administrator'))) {
      return 'mayNot';
    }

    return imports ?? 'unavailable';
  };

  app.openapi(importStatusRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    return context.json(await importer.status(), 200);
  });

  app.openapi(connectImportRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const connected = await importer.connect(context.req.valid('json'));

    return connected.kind === 'connected'
      ? context.json(connected.source, 201)
      : context.json(refuseWith(connected.reason), 400);
  });

  app.openapi(forgetImportRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    return (await importer.forget(context.req.valid('param').sourceId))
      ? context.json({ done: true }, 200)
      : context.json(NO_SOURCE, 404);
  });

  app.openapi(importPeopleRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const people = await importer.people(context.req.valid('param').sourceId);

    if (people === null) {
      return context.json(NO_SOURCE, 404);
    }

    return Array.isArray(people)
      ? context.json({ people }, 200)
      : context.json(refuseWith(people.reason), 400);
  });

  app.openapi(importPinRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const given = await importer.givePin(
      context.req.valid('param').sourceId,
      context.req.valid('json'),
    );

    if (given === null) {
      return context.json(NO_SOURCE, 404);
    }

    return given === 'given'
      ? context.json({ done: true }, 200)
      : context.json(refuseWith(given.reason), 400);
  });

  app.openapi(importLibrariesRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const libraries = await importer.libraries(context.req.valid('param').sourceId);

    if (libraries === null) {
      return context.json(NO_SOURCE, 404);
    }

    return 'reason' in libraries
      ? context.json(refuseWith(libraries.reason), 400)
      : context.json(libraries, 200);
  });

  app.openapi(importMappingsRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const libraries = await importer.saveMappings(
      context.req.valid('param').sourceId,
      context.req.valid('json').mappings,
    );

    if (libraries === null) {
      return context.json(NO_SOURCE, 404);
    }

    return 'reason' in libraries
      ? context.json(refuseWith(libraries.reason), 400)
      : context.json(libraries, 200);
  });

  app.openapi(linkImportLibraryRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const libraries = await importer.linkLibrary(
      context.req.valid('param').sourceId,
      context.req.valid('json'),
    );

    if (libraries === null) {
      return context.json(NO_SOURCE, 404);
    }

    return 'reason' in libraries
      ? context.json(refuseWith(libraries.reason), 400)
      : context.json(libraries, 200);
  });

  app.openapi(createImportLibrariesRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const made = await importer.createLibraries(
      context.req.valid('param').sourceId,
      context.req.valid('json'),
    );

    return made === null ? context.json(NO_SOURCE, 404) : context.json({ libraries: made }, 200);
  });

  app.openapi(planImportRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const run = await importer.plan(
      context.req.valid('param').sourceId,
      context.req.valid('json'),
      await accountOf(context.req.raw.headers),
    );

    return run === null ? context.json(NO_SOURCE, 404) : context.json(run, 202);
  });

  app.openapi(readImportRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const run = await importer.readRun(context.req.valid('param').runId);

    return run === null ? context.json(NO_RUN, 404) : context.json(run, 200);
  });

  app.openapi(startImportRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const run = await importer.start(context.req.valid('param').runId);

    if (run === null) {
      return context.json(NO_RUN, 404);
    }

    return run === 'notPlanned'
      ? context.json(refuse('error.imports.thatImportIsNotReadyToRun'), 409)
      : context.json(run, 202);
  });

  app.openapi(cancelImportRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const run = await importer.cancel(context.req.valid('param').runId);

    return run === null ? context.json(NO_RUN, 404) : context.json(run, 200);
  });

  app.openapi(importSetupLinksRoute, async (context) => {
    const importer = await gate(context.req.raw.headers);

    if (importer === 'mayNot') {
      return context.json(MAY_NOT, 403);
    }

    if (importer === 'unavailable') {
      return context.json(UNAVAILABLE, 503);
    }

    const headers = context.req.raw.headers;
    const links = await importer.setupLinks(
      context.req.valid('param').runId,
      context.req.valid('json').lifetimeDays,
      await accountOf(headers),
      await originOf(headers),
    );

    return links === null ? context.json(NO_RUN, 404) : context.json(links, 200);
  });
};

export { registerImportRoutes };
