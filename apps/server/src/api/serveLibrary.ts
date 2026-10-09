import { bodyOf } from '@ValenceI18n/bodyOf';
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
  listLeftOutRoute,
  leaveOutRoute,
  bringBackRoute,
  rebuildArtefactsRoute,
  deleteMediaRoute,
  moveMediaRoute,
  deleteSeriesRoute,
  setPreviewMomentRoute,
  clearPreviewMomentRoute,
  resetLibraryRoute,
  deleteLibraryRoute,
  regeneratePreviewsRoute,
  artworkChoicesRoute,
  chooseArtworkRoute,
  forgetArtworkRoute,
} from '@ValenceServer/routes/LibraryRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import { arrKindOf } from '@ValenceContracts/functions/arrKindOf';

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
    requestsClient,
  } = context;

  app.openapi(listLibrariesRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return context.json(await library.list(viewer), 200);
  });

  app.openapi(createLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.create'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { name, kind, path, flavour } = context.req.valid('json');

    const created = await library.create({
      name,
      kind,
      path,
      ...(flavour === undefined ? {} : { flavour }),
    });

    if (created === null) {
      return context.json(refuse('error.library.thatPathIsNotAReadable'), 400);
    }

    return context.json(created, 201);
  });

  app.openapi(updateLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const {
      defaultAudioLanguage,
      filesAtOnce,
      takesRequests,
      requestProfileId,
      requestPath,
      keepsShowsTogether,
      fulfilment,
    } = context.req.valid('json');
    const libraryId = context.req.valid('param').id;

    if (fulfilment !== undefined && fulfilment !== null) {
      const kind = (await library.list(asTheServer)).find((entry) => entry.id === libraryId)?.kind;
      const apps = await requestsClient?.listArrApps();
      const app =
        apps?.kind === 'answered'
          ? apps.value.find((one) => one.id === fulfilment.appId)
          : undefined;

      if (kind !== undefined && (app === undefined || app.kind !== arrKindOf(kind))) {
        return context.json(refuse('error.library.thatAppCannotFulfilThisLibrary'), 400);
      }
    }

    const updated = await library.update(libraryId, {
      defaultAudioLanguage,
      ...(filesAtOnce === undefined ? {} : { filesAtOnce }),
      ...(takesRequests === undefined ? {} : { takesRequests }),
      ...(requestProfileId === undefined ? {} : { requestProfileId }),
      ...(requestPath === undefined
        ? {}
        : { requestPath: requestPath === '' ? null : requestPath }),
      ...(keepsShowsTogether === undefined ? {} : { keepsShowsTogether }),
      ...(fulfilment === undefined ? {} : { fulfilment }),
    });

    if (updated === null) {
      return context.json(refuse('error.common.noSuchLibrary'), 404);
    }

    return context.json(updated, 200);
  });

  app.openapi(listFacetsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return context.json(await library.listFacets(viewer), 200);
  });

  app.openapi(listItemsRoute, async (context) => {
    const { id } = context.req.valid('param');
    const { search, kind, genre, yearFrom, yearTo, minRating, ids, order, limit, offset } =
      context.req.valid('query');

    const { minYourStars, versions } = context.req.valid('query');
    const askedBy = await readProfileId(context.req.raw.headers);
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
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
      ...(versions === 'all' ? { withVersions: true } : {}),
      limit: limit ?? DEFAULT_LIMIT,
      offset: offset ?? 0,
    });

    if (page === null) {
      return context.json(refuse('error.common.noSuchLibrary'), 404);
    }

    return context.json(page, 200);
  });

  app.openapi(listShowsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const shows = await library.listShows(viewer, context.req.valid('param').id);

    if (shows === null) {
      return context.json(refuse('error.common.noSuchLibrary'), 404);
    }

    return context.json({ shows }, 200);
  });

  app.openapi(getShowRoute, async (context) => {
    const { id, showId } = context.req.valid('param');
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const show = await library.getShow(viewer, id, showId);

    if (show === null) {
      return context.json(refuse('error.library.noSuchSeries'), 404);
    }

    return context.json(show, 200);
  });

  app.openapi(comingUpRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return context.json({ shows: await library.comingUp(viewer) }, 200);
  });

  app.openapi(getMediaRoute, async (context) => {
    const item = await library.getMedia(context.req.valid('param').id);

    if (item === null) {
      return context.json(refuse('error.common.noSuchItem'), 404);
    }

    return context.json(item, 200);
  });

  app.openapi(scanLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
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
      return context.json(refuse('error.common.noSuchLibrary'), 404);
    }

    return context.json(queued, 202);
  });

  app.openapi(correctMatchRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const { reference, kind } = context.req.valid('json');
    const read = readCatalogueReference(reference);

    if (read === null) {
      return context.json(refuse('error.library.thatDoesNotLookLikeA'), 400);
    }

    const externalKind = read.kind ?? kind ?? null;

    if (externalKind === null) {
      return context.json(refuse('error.library.sayWhetherThatIdIsA'), 400);
    }

    const corrected = await library.correctMatch(
      context.req.valid('param').id,
      { externalId: read.id, externalKind },
      (await readAccount(context.req.raw.headers))?.id ?? null,
    );

    return corrected === null
      ? context.json(refuse('error.common.noSuchItem'), 404)
      : context.json(corrected, 200);
  });

  app.openapi(listLeftOutRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const leftOut = await library.listLeftOut(context.req.valid('param').id);

    return leftOut === null
      ? context.json(refuse('error.common.noSuchLibrary'), 404)
      : context.json(leftOut, 200);
  });

  app.openapi(leaveOutRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const left = await library.leaveOut(
      context.req.valid('param').id,
      context.req.valid('json'),
      (await readAccount(context.req.raw.headers))?.id ?? null,
    );

    if (left.kind === 'noLibrary') {
      return context.json(refuse('error.common.noSuchLibrary'), 404);
    }

    if (left.kind === 'outside') {
      return context.json(refuse('error.library.thatIsNotInsideThisLibrary'), 400);
    }

    return context.json({ leftOut: left.leftOut, jobId: left.jobId }, 201);
  });

  app.openapi(bringBackRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { id, leftOutId } = context.req.valid('param');
    const back = await library.bringBack(id, leftOutId);

    return back === null
      ? context.json(refuse('error.library.nothingLikeThatIsLeftOut'), 404)
      : context.json(back, 200);
  });

  app.openapi(artworkChoicesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const read = await library.readArtworkChoices(context.req.valid('param').id);

    if (read === 'missing') {
      return context.json(refuse('error.common.noSuchItem'), 404);
    }

    if (read === 'unmatched') {
      return context.json(refuse('error.library.notMatchedToTheCatalogueYet'), 404);
    }

    if (read === 'unavailable') {
      return context.json(refuse('error.library.catalogueCouldNotBeAsked'), 503);
    }

    return context.json(read, 200);
  });

  app.openapi(chooseArtworkRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const { id, kind } = context.req.valid('param');
    const chosen = await library.chooseArtwork(
      id,
      kind,
      context.req.valid('json').url,
      (await readAccount(context.req.raw.headers))?.id ?? null,
    );

    if (chosen === 'missing' || chosen === 'unmatched') {
      return context.json(refuse('error.library.noSuchItemMatchedToTheCatalogue'), 404);
    }

    if (chosen === 'unavailable') {
      return context.json(refuse('error.library.catalogueCouldNotBeAsked'), 503);
    }

    if (chosen === 'refused') {
      return context.json(refuse('error.library.pictureIsNotOneTheCatalogueHas'), 400);
    }

    return context.json(chosen, 200);
  });

  app.openapi(forgetArtworkRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const { id, kind } = context.req.valid('param');
    const forgotten = await library.chooseArtwork(
      id,
      kind,
      null,
      (await readAccount(context.req.raw.headers))?.id ?? null,
    );

    return typeof forgotten === 'string'
      ? context.json(refuse('error.library.noSuchItemMatchedToTheCatalogue'), 404)
      : context.json(forgotten, 200);
  });

  app.openapi(forgetCorrectionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const forgotten = await library.forgetCorrection(context.req.valid('param').id);

    return forgotten === null
      ? context.json(refuse('error.common.noSuchItem'), 404)
      : context.json(forgotten, 200);
  });

  app.openapi(rebuildArtefactsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const rebuilt = await library.rebuildArtefacts(context.req.valid('param').id);

    return rebuilt === null
      ? context.json(refuse('error.common.noSuchItem'), 404)
      : context.json(rebuilt, 200);
  });

  app.openapi(moveMediaRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.delete'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const { mediaIds, libraryId } = context.req.valid('json');
    const moved = await library.moveMedia(mediaIds, libraryId);

    switch (moved.kind) {
      case 'moved':
        return context.json({ files: moved.files, jobId: moved.jobId }, 200);
      case 'absent':
        return context.json(refuse('error.common.noSuchItem'), 404);
      case 'wrongKind':
        return context.json(refuse('error.library.onlyFilmsAndShowsMove'), 400);
      case 'sameLibrary':
        return context.json(refuse('error.library.itIsAlreadyInThatLibrary'), 409);
      case 'taken':
        return context.json(refuse('error.library.aFileIsAlreadyThere'), 409);
      case 'outside':
        return context.json(refuse('error.library.thatFileIsNotInsideItsLibrary'), 403);
      case 'readOnly':
        return context.json(refuse('error.library.thatDiskIsReadOnlyForMoving'), 403);
      case 'denied':
        return context.json(refuse('error.library.valenceMayNotMoveFilesThere'), 403);
      case 'missing':
        return context.json(refuse('error.library.theFileIsNoLongerThere'), 404);
      case 'failed':
        return context.json(refuse('error.library.theFileCouldNotBeMoved'), 500);
    }
  });

  app.openapi(deleteMediaRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.delete'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const deleted = await library.deleteMedia(context.req.valid('param').id);

    if (deleted.kind === 'deleted') {
      return context.body(null, 204);
    }

    if (deleted.kind === 'absent') {
      return context.json(refuse('error.common.noSuchItem'), 404);
    }

    const said = sayWhyNotDeleted(deleted);

    return context.json(bodyOf(said), said.status);
  });

  app.openapi(deleteSeriesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.delete'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const deleted = await library.deleteSeries(context.req.valid('param').seriesId);

    if (deleted.kind === 'deleted') {
      return context.json({ files: deleted.files }, 200);
    }

    if (deleted.kind === 'absent') {
      return context.json(refuse('error.library.noSuchSeries'), 404);
    }

    const said = sayWhyNotDeleted(deleted);

    return context.json(bodyOf(said), said.status);
  });

  app.openapi(setPreviewMomentRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const { atSeconds, durationSeconds } = context.req.valid('json');
    const outcome = await library.setPreviewMoment(
      context.req.valid('param').id,
      { atSeconds, durationSeconds: durationSeconds ?? null },
      (await readAccount(context.req.raw.headers))?.id ?? null,
    );

    if (outcome.kind === 'absent') {
      return context.json(refuse('error.common.noSuchItem'), 404);
    }

    if (outcome.kind === 'beyondTheEnd') {
      return context.json(
        refuse('error.library.thatIsPastTheEndThe', {
          durationSeconds: outcome.durationSeconds.toString(),
        }),
        400,
      );
    }

    return context.json(outcome.moment, 200);
  });

  app.openapi(clearPreviewMomentRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const cleared = await library.clearPreviewMoment(context.req.valid('param').id);

    return cleared === null
      ? context.json(refuse('error.common.noSuchItem'), 404)
      : context.json(cleared, 200);
  });

  app.openapi(runningScansRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
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
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { jobId } = context.req.valid('param');
    const { state, phase, processed, total, item } = await library.readScanState(jobId);

    return context.json({ jobId, state, phase, processed, total, item }, 200);
  });

  app.openapi(resetLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.runDestructive'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const reset = await library.reset(context.req.valid('param').id);

    if (reset === null) {
      return context.json(refuse('error.common.noSuchLibrary'), 404);
    }

    return context.json(reset, 202);
  });

  app.openapi(deleteLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.delete'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    if (!(await library.remove(context.req.valid('param').id))) {
      return context.json(refuse('error.common.noSuchLibrary'), 404);
    }

    return context.body(null, 204);
  });

  app.openapi(regeneratePreviewsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const queued = await library.regeneratePreviews(context.req.valid('param').id);

    if (queued === null) {
      return context.json(refuse('error.common.noSuchLibrary'), 404);
    }

    return context.json(queued, 202);
  });
};

export { serveLibrary };
