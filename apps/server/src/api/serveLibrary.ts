import { sayCount } from '@ValenceI18n/sayCount';
import { say } from '@ValenceI18n/say';
import { readCatalogueReference } from '@ValenceCore/functions/readCatalogueReference';
import { DEFAULT_LIMIT } from '@ValenceServer/library/LibraryService';
import {
  listLibrariesRoute,
  createLibraryRoute,
  updateLibraryRoute,
  listItemsRoute,
  listFacetsRoute,
  getMediaRoute,
  listShowsRoute,
  getShowRoute,
  comingUpRoute,
  scanLibraryRoute,
  scanStateRoute,
  runningScansRoute,
  correctMatchRoute,
  forgetCorrectionRoute,
  rebuildArtefactsRoute,
  deleteMediaRoute,
  deleteSeriesRoute,
  setPreviewMomentRoute,
  clearPreviewMomentRoute,
  resetLibraryRoute,
  deleteLibraryRoute,
  regeneratePreviewsRoute,
} from '@ValenceServer/routes/LibraryRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the library endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveLibrary = (app: OpenAPIHono, context: AppContext): void => {
  const {
    library,
    listRunningJobs,
    requires,
    viewerOf,
    sayWhyNotDeleted,
    readProfileId,
    readAccount,
  } = context;

  app.openapi(listLibrariesRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json(await library.list(viewer), 200);
  });

  app.openapi(createLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.create'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { name, kind, path, flavour } = context.req.valid('json');

    const created = await library.create({
      name,
      kind,
      path,
      ...(flavour === undefined ? {} : { flavour }),
    });

    if (created === null) {
      return context.json({ error: say('server.errors.notReadableDirectory') }, 400);
    }

    return context.json(created, 201);
  });

  app.openapi(updateLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { defaultAudioLanguage, filesAtOnce, takesRequests, requestProfileId, requestPath } =
      context.req.valid('json');

    const updated = await library.update(context.req.valid('param').id, {
      defaultAudioLanguage,
      ...(filesAtOnce === undefined ? {} : { filesAtOnce }),
      ...(takesRequests === undefined ? {} : { takesRequests }),
      ...(requestProfileId === undefined ? {} : { requestProfileId }),
      ...(requestPath === undefined
        ? {}
        : { requestPath: requestPath === '' ? null : requestPath }),
    });

    if (updated === null) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    return context.json(updated, 200);
  });

  app.openapi(listFacetsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json(await library.listFacets(viewer), 200);
  });

  app.openapi(listItemsRoute, async (context) => {
    const { id } = context.req.valid('param');
    const { search, kind, genre, yearFrom, yearTo, minRating, ids, order, limit, offset } =
      context.req.valid('query');

    const { minYourStars } = context.req.valid('query');
    const askedBy = await readProfileId(context.req.raw.headers);
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const page = await library.listItems(viewer, id, {
      ...(search === undefined ? {} : { search }),
      ...(kind === undefined ? {} : { kind }),
      ...(genre === undefined ? {} : { genre }),
      ...(yearFrom === undefined ? {} : { yearFrom }),
      ...(yearTo === undefined ? {} : { yearTo }),
      ...(minRating === undefined ? {} : { minRating }),
      ...(ids === undefined ? {} : { ids: ids.split(',').filter((named) => named.trim() !== '') }),
      ...(order === undefined ? {} : { order }),
      ...(askedBy === null ? {} : { profileId: askedBy }),
      ...(minYourStars === undefined ? {} : { minYourStars }),
      limit: limit ?? DEFAULT_LIMIT,
      offset: offset ?? 0,
    });

    if (page === null) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    return context.json(page, 200);
  });

  app.openapi(listShowsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const shows = await library.listShows(viewer, context.req.valid('param').id);

    if (shows === null) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    return context.json({ shows }, 200);
  });

  app.openapi(getShowRoute, async (context) => {
    const { id, showId } = context.req.valid('param');
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const show = await library.getShow(viewer, id, showId);

    if (show === null) {
      return context.json({ error: say('server.errors.noSuchSeries') }, 404);
    }

    return context.json(show, 200);
  });

  app.openapi(comingUpRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json({ shows: await library.comingUp(viewer) }, 200);
  });

  app.openapi(getMediaRoute, async (context) => {
    const item = await library.getMedia(context.req.valid('param').id);

    if (item === null) {
      return context.json({ error: say('server.errors.noSuchItem') }, 404);
    }

    return context.json(item, 200);
  });

  app.openapi(scanLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const asked = context.req.valid('query');

    const queued = await library.scan(
      context.req.valid('param').id,
      asked.force === 'true',
      asked.runId === undefined || asked.runOf === undefined
        ? undefined
        : { id: asked.runId, of: asked.runOf },
    );

    if (queued === null) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    return context.json(queued, 202);
  });

  app.openapi(correctMatchRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 404);
    }

    const { reference, kind } = context.req.valid('json');
    const read = readCatalogueReference(reference);

    if (read === null) {
      return context.json({ error: say('server.errors.notCatalogueAddress') }, 400);
    }

    const externalKind = read.kind ?? kind ?? null;

    if (externalKind === null) {
      return context.json({ error: say('server.errors.sayFilmOrSeries') }, 400);
    }

    const corrected = await library.correctMatch(
      context.req.valid('param').id,
      { externalId: read.id, externalKind },
      (await readAccount(context.req.raw.headers))?.id ?? null,
    );

    return corrected === null
      ? context.json({ error: say('server.errors.noSuchItem') }, 404)
      : context.json(corrected, 200);
  });

  app.openapi(forgetCorrectionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 404);
    }

    const forgotten = await library.forgetCorrection(context.req.valid('param').id);

    return forgotten === null
      ? context.json({ error: say('server.errors.noSuchItem') }, 404)
      : context.json(forgotten, 200);
  });

  app.openapi(rebuildArtefactsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 404);
    }

    const rebuilt = await library.rebuildArtefacts(context.req.valid('param').id);

    return rebuilt === null
      ? context.json({ error: say('server.errors.noSuchItem') }, 404)
      : context.json(rebuilt, 200);
  });

  app.openapi(deleteMediaRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.delete'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 404);
    }

    const deleted = await library.deleteMedia(context.req.valid('param').id);

    if (deleted.kind === 'deleted') {
      return context.body(null, 204);
    }

    if (deleted.kind === 'absent') {
      return context.json({ error: say('server.errors.noSuchItem') }, 404);
    }

    const said = sayWhyNotDeleted(deleted);

    return context.json({ error: said.error }, said.status);
  });

  app.openapi(deleteSeriesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.delete'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 404);
    }

    const deleted = await library.deleteSeries(context.req.valid('param').seriesId);

    if (deleted.kind === 'deleted') {
      return context.json({ files: deleted.files }, 200);
    }

    if (deleted.kind === 'absent') {
      return context.json({ error: say('server.errors.noSuchSeries') }, 404);
    }

    const said = sayWhyNotDeleted(deleted);

    return context.json({ error: said.error }, said.status);
  });

  app.openapi(setPreviewMomentRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 404);
    }

    const { atSeconds, durationSeconds } = context.req.valid('json');
    const outcome = await library.setPreviewMoment(
      context.req.valid('param').id,
      { atSeconds, durationSeconds: durationSeconds ?? null },
      (await readAccount(context.req.raw.headers))?.id ?? null,
    );

    if (outcome.kind === 'absent') {
      return context.json({ error: say('server.errors.noSuchItem') }, 404);
    }

    if (outcome.kind === 'beyondTheEnd') {
      return context.json(
        {
          error: sayCount('server.errors.pastTheEnd', outcome.durationSeconds),
        },
        400,
      );
    }

    return context.json(outcome.moment, 200);
  });

  app.openapi(clearPreviewMomentRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 404);
    }

    const cleared = await library.clearPreviewMoment(context.req.valid('param').id);

    return cleared === null
      ? context.json({ error: say('server.errors.noSuchItem') }, 404)
      : context.json(cleared, 200);
  });

  app.openapi(runningScansRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    return context.json(
      {
        scans: listRunningJobs().map((job) => ({
          jobId: job.jobId,
          kind: job.kind,
          libraryId: job.subject,
          phase: job.progress?.phase ?? null,
          processed: job.progress?.processed ?? null,
          total: job.progress?.total ?? null,
          item: job.progress?.item ?? null,
        })),
      },
      200,
    );
  });

  app.openapi(scanStateRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const { jobId } = context.req.valid('param');
    const { state, phase, processed, total, item } = await library.readScanState(jobId);

    return context.json({ jobId, state, phase, processed, total, item }, 200);
  });

  app.openapi(resetLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.runDestructive'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const reset = await library.reset(context.req.valid('param').id);

    if (reset === null) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    return context.json(reset, 202);
  });

  app.openapi(deleteLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.delete'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (!(await library.remove(context.req.valid('param').id))) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(regeneratePreviewsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    const queued = await library.regeneratePreviews(context.req.valid('param').id);

    if (queued === null) {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    return context.json(queued, 202);
  });
};

export { serveLibrary };
