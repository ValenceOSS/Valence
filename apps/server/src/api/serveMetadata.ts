import {
  listTitlesRoute,
  listTitleValuesRoute,
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
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

const NOT_FOR_YOU = refuse('common.thatIsForAdministrators');

const NO_SUCH_ITEM = refuse('error.common.noSuchItem');

/**
 * Registers the endpoints an administrator reads and edits a title's metadata through: every
 * field with where its value came from, edits kept through every scan, and their history.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveMetadata = (app: OpenAPIHono, context: AppContext): void => {
  const { titleMetadata, titleList, library, requires, readAccount, recordAudit } = context;

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

  app.openapi(listTitlesRoute, async (context) => {
    if (titleList === undefined || !(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const { libraryId, sort, search, after, limit } = context.req.valid('query');

    return context.json(
      await titleList.list({
        sort,
        limit,
        ...(libraryId === undefined ? {} : { libraryId }),
        ...(search === undefined ? {} : { search }),
        ...(after === undefined ? {} : { after }),
      }),
      200,
    );
  });

  app.openapi(listTitleValuesRoute, async (context) => {
    if (titleList === undefined || !(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const { field, libraryId } = context.req.valid('query');

    return context.json(await titleList.values(field, libraryId), 200);
  });

  app.openapi(readTitleFilesRoute, async (context) => {
    if (titleList === undefined || !(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(NOT_FOR_YOU, 404);
    }

    const files = await titleList.filesOf(context.req.valid('param').id);

    return files === null || files.length === 0
      ? context.json(NO_SUCH_ITEM, 404)
      : context.json({ files }, 200);
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
