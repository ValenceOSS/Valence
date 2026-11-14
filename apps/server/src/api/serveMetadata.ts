import { TitleListQuerySchema } from '@ValenceContracts/schemas/TitleList';
import { csvOfTitles } from '@ValenceServer/metadata/csvOfTitles';
import {
  listOrphanedEditsRoute,
  attachOrphanedEditsRoute,
  forgetOrphanedEditsRoute,
  readTitlesTogetherRoute,
  editTitlesTogetherRoute,
  undoTitlesTogetherRoute,
  listTitlesRoute,
  listTitleKeysRoute,
  listTitleChoicesRoute,
  countLibraryProblemsRoute,
  listTitleValuesRoute,
  findTitleCandidatesRoute,
  findCataloguePeopleRoute,
  readTitleFilesRoute,
  refreshTitleRoute,
  unmatchTitleRoute,
  previewMatchRoute,
  editTitleMetadataRoute,
  readTitleHistoryRoute,
  readTitleMetadataRoute,
  undoTitleChangeRoute,
} from '@ValenceServer/routes/MetadataRoute';
import { refuse } from '@ValenceI18n/refuse';
import { createEveryTitleGate } from '@ValenceServer/metadata/createEveryTitleGate';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

const NOT_FOR_YOU = refuse('common.thatIsForAdministrators');

const NO_SUCH_ITEM = refuse('error.common.noSuchItem');

const EVERY_TITLE = 1_000_000;

/**
 * Registers the endpoints an administrator reads and edits a title's metadata through: every
 * field with where its value came from, edits kept through every scan, and their history.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveMetadata = (app: OpenAPIHono, context: AppContext): void => {
  const {
    titleMetadata,
    titleList,
    bulkTitles,
    orphanedEdits,
    findCandidates,
    findCataloguePeople,
    library,
    requires,
    readAccount,
    recordAudit,
    viewerOf,
  } = context;
  const mayManageEveryTitle = createEveryTitleGate({ requires, viewerOf, library });

  /**
   * Reads who is changing a title, for the history.
   *
   * @param headers - The request's headers.
   * @returns Their account's id and name.
   */
  const actorOf = async (headers: Headers) => {
    const account = await readAccount(headers);

    return { id: account?.id ?? null, name: account?.name ?? null };
  };

  app.openapi(readTitleMetadataRoute, async (context) => {
    if (
      titleMetadata === undefined ||
      !(await requires(context.req.raw.headers, 'media.override'))
    ) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const read = await titleMetadata.read(
      context.req.valid('param').id,
      context.req.valid('query').scope,
    );

    return typeof read === 'string' ? context.json(NO_SUCH_ITEM, 404) : context.json(read, 200);
  });

  app.openapi(editTitleMetadataRoute, async (context) => {
    if (
      titleMetadata === undefined ||
      !(await requires(context.req.raw.headers, 'media.override'))
    ) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const edited = await titleMetadata.edit(
      context.req.valid('param').id,
      context.req.valid('query').scope,
      context.req.valid('json'),
      await actorOf(context.req.raw.headers),
    );

    if (edited === 'invalid') {
      return context.json(refuse('error.metadata.thatValueCannotBeSaved'), 400);
    }

    if (typeof edited === 'string') {
      return context.json(NO_SUCH_ITEM, 404);
    }

    if (edited.changeSetId !== null) {
      await recordAudit(context, 'media.metadataChanged', edited.metadata.subject.key, {
        fields: Object.keys(context.req.valid('json').set ?? {})
          .concat(context.req.valid('json').reset ?? [], context.req.valid('json').lock ?? [])
          .join(', '),
        changeSet: edited.changeSetId,
      });
    }

    return context.json(edited, 200);
  });

  app.openapi(listOrphanedEditsRoute, async (context) => {
    if (orphanedEdits === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    return context.json(await orphanedEdits.list(context.req.valid('query').libraryId), 200);
  });

  app.openapi(attachOrphanedEditsRoute, async (context) => {
    if (orphanedEdits === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const { libraryId, key, toId } = context.req.valid('json');
    const moved = await orphanedEdits.attach(libraryId, key, toId);

    if (moved === null) {
      return context.json(NO_SUCH_ITEM, 404);
    }

    await recordAudit(context, 'media.metadataChanged', key, { attachedTo: toId });

    return context.json({ edits: moved }, 200);
  });

  app.openapi(forgetOrphanedEditsRoute, async (context) => {
    if (orphanedEdits === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const { libraryId, key } = context.req.valid('json');
    const gone = await orphanedEdits.throwAway(libraryId, key);

    await recordAudit(context, 'media.metadataUndone', key, { thrownAway: gone.toString() });

    return context.json({ edits: gone }, 200);
  });

  app.openapi(readTitlesTogetherRoute, async (context) => {
    if (bulkTitles === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    return context.json(await bulkTitles.readMany(context.req.valid('json')), 200);
  });

  app.openapi(editTitlesTogetherRoute, async (context) => {
    if (bulkTitles === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const { subjects, ...outcome } = await bulkTitles.editMany(
      context.req.valid('json'),
      await actorOf(context.req.raw.headers),
    );

    for (const subject of subjects) {
      await recordAudit(context, 'media.metadataChanged', subject, {
        fields: Object.keys(context.req.valid('json').change).join(', '),
        changeSet: outcome.changeSetId,
      });
    }

    return context.json(outcome, 200);
  });

  app.openapi(undoTitlesTogetherRoute, async (context) => {
    if (bulkTitles === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const undone = await bulkTitles.undoMany(
      context.req.valid('json'),
      await actorOf(context.req.raw.headers),
    );

    if (undone === 'changedSince') {
      return context.json(refuse('error.metadata.thatChangeWasChangedSince'), 409);
    }

    await recordAudit(context, 'media.metadataUndone', context.req.valid('json').changeSetId, {
      changeSet: undone.changeSetId,
      titles: undone.undone.toString(),
    });

    return context.json(undone, 200);
  });

  app.openapi(listTitlesRoute, async (context) => {
    if (titleList === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const { after, limit, ...query } = context.req.valid('query');

    return context.json(await titleList.list(query, after, limit), 200);
  });

  app.openapi(listTitleKeysRoute, async (context) => {
    if (titleList === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    return context.json(await titleList.keys(context.req.valid('query')), 200);
  });

  app.openapi(listTitleChoicesRoute, async (context) => {
    if (titleList === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    return context.json(await titleList.choices(context.req.valid('query').libraryId), 200);
  });

  app.openapi(countLibraryProblemsRoute, async (context) => {
    if (titleList === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    return context.json(await titleList.problems(), 200);
  });

  app.openapi(listTitleValuesRoute, async (context) => {
    if (titleList === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const { field, libraryId } = context.req.valid('query');

    return context.json(await titleList.values(field, libraryId), 200);
  });

  app.openapi(findTitleCandidatesRoute, async (context) => {
    if (findCandidates === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    return context.json(await findCandidates(context.req.valid('query')), 200);
  });

  app.openapi(findCataloguePeopleRoute, async (context) => {
    if (
      findCataloguePeople === undefined ||
      !(await mayManageEveryTitle(context.req.raw.headers))
    ) {
      return context.json(NOT_FOR_YOU, 404);
    }

    return context.json(
      { people: await findCataloguePeople(context.req.valid('query').name) },
      200,
    );
  });

  app.get('/api/admin/titles/export', async (context) => {
    if (titleList === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const query = TitleListQuerySchema.safeParse({
      ...context.req.query(),
      filter: context.req.queries('filter') ?? [],
    });

    if (!query.success) {
      return context.json(refuse('error.metadata.thoseTitlesCouldNotBeListed'), 400);
    }

    const { titles } = await titleList.list(query.data, undefined, EVERY_TITLE);

    return context.body(csvOfTitles(titles), 200, {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="titles.csv"',
      'cache-control': 'no-store',
    });
  });

  app.openapi(readTitleFilesRoute, async (context) => {
    if (titleList === undefined || !(await mayManageEveryTitle(context.req.raw.headers))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const files = await titleList.filesOf(context.req.valid('param').id);

    return files === null ? context.json(NO_SUCH_ITEM, 404) : context.json(files, 200);
  });

  app.openapi(previewMatchRoute, async (context) => {
    if (
      titleMetadata === undefined ||
      !(await requires(context.req.raw.headers, 'media.override'))
    ) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const previewed = await titleMetadata.preview(
      context.req.valid('param').id,
      context.req.valid('query'),
    );

    if (previewed === 'notInCatalogue') {
      return context.json(refuse('error.common.theCatalogueDoesNotKnowThat'), 404);
    }

    return typeof previewed === 'string'
      ? context.json(NO_SUCH_ITEM, 404)
      : context.json(previewed, 200);
  });

  app.openapi(refreshTitleRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const { id } = context.req.valid('param');
    const { mode, fields } = context.req.valid('json');

    if (mode === 'fields') {
      const refreshed =
        titleMetadata === undefined
          ? 'missing'
          : await titleMetadata.refreshFields(id, fields ?? []);

      if (refreshed === 'notThisKind') {
        return context.json(refuse('error.library.notMatchedToTheCatalogueYet'), 400);
      }

      if (refreshed === 'notInCatalogue') {
        return context.json(refuse('error.common.theCatalogueDoesNotKnowThat'), 404);
      }

      if (typeof refreshed === 'string') {
        return context.json(NO_SUCH_ITEM, 404);
      }

      await recordAudit(context, 'media.refreshed', refreshed.metadata.subject.key, {
        mode,
        fields: (fields ?? []).join(', '),
      });

      return context.json({ corrected: refreshed.updated, jobId: null }, 200);
    }

    const reached =
      mode === 'matchAgain'
        ? await library.forgetCorrection(id)
        : await library.refreshTitle(id, mode);

    if (reached === null) {
      return context.json(NO_SUCH_ITEM, 404);
    }

    await recordAudit(context, mode === 'matchAgain' ? 'media.matchReset' : 'media.refreshed', id, {
      mode,
      files: reached.corrected.toString(),
    });

    return context.json(reached, 200);
  });

  app.openapi(unmatchTitleRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const { id } = context.req.valid('param');
    const reached = await library.unmatch(id, (await actorOf(context.req.raw.headers)).id);

    if (reached === null) {
      return context.json(NO_SUCH_ITEM, 404);
    }

    await recordAudit(context, 'media.unmatched', id, { files: reached.corrected.toString() });

    return context.json(reached, 200);
  });

  app.openapi(readTitleHistoryRoute, async (context) => {
    if (
      titleMetadata === undefined ||
      !(await requires(context.req.raw.headers, 'media.override'))
    ) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const history = await titleMetadata.history(
      context.req.valid('param').id,
      context.req.valid('query').scope,
    );

    return typeof history === 'string'
      ? context.json(NO_SUCH_ITEM, 404)
      : context.json(history, 200);
  });

  app.openapi(undoTitleChangeRoute, async (context) => {
    if (
      titleMetadata === undefined ||
      !(await requires(context.req.raw.headers, 'media.override'))
    ) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const { id, changeSetId } = context.req.valid('param');
    const undone = await titleMetadata.undo(
      id,
      context.req.valid('query').scope,
      changeSetId,
      await actorOf(context.req.raw.headers),
    );

    if (undone === 'changedSince') {
      return context.json(refuse('error.metadata.thatChangeWasChangedSince'), 409);
    }

    if (typeof undone === 'string') {
      return context.json(NO_SUCH_ITEM, 404);
    }

    await recordAudit(context, 'media.metadataUndone', undone.metadata.subject.key, {
      changeSet: changeSetId,
    });

    return context.json(undone, 200);
  });
};

export { serveMetadata };
