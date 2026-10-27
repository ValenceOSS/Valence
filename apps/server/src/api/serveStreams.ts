import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';
import { refuseWith } from '@ValenceI18n/refuseWith';
import { SaidError } from '@ValenceI18n/SaidError';
import { PinnedRequestRefusal } from '@ValenceCore/network/PinnedRequestRefusal';
import { TranscoderError } from '@ValenceServer/transcoder/TranscoderClient';
import type { StreamTitle } from '@ValenceSDK/sources/StreamTitleSchema';
import type { AppContext } from '@ValenceServer/api/AppContext';
import {
  listStreamOffersRoute,
  playStreamRoute,
  readStreamedLibraryRoute,
} from '@ValenceServer/routes/StreamRoute';
import { StreamRefusal } from '@ValenceServer/streamSources/StreamRefusal';

const NOBODY = refuse('error.common.nobodyIsSignedIn');

const NOT_ALLOWED = refuse('error.streams.youMayNotPlayFilmsFrom');

/**
 * Registers the endpoints for films played straight from the sources plugins offer: what can play
 * a film, playing one, and the hidden library such films are kept in.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveStreams = (app: OpenAPIHono, context: AppContext): void => {
  const { streaming, requires, viewerOf, describeForRequest } = context;

  app.openapi(listStreamOffersRoute, async (asked) => {
    const headers = asked.req.raw.headers;

    if ((await viewerOf(headers)) === null) {
      return asked.json(NOBODY, 401);
    }

    if (streaming === null || !(await requires(headers, 'sources.play'))) {
      return asked.json(NOT_ALLOWED, 403);
    }

    const { tmdbId } = asked.req.valid('param');
    const described = await describeForRequest(tmdbId, 'film');

    if (described === null) {
      return asked.json(refuse('error.streams.theCatalogueHasNoSuchFilm'), 404);
    }

    const title: StreamTitle = {
      kind: 'film',
      catalogueId: tmdbId.toString(),
      tmdbId: tmdbId.toString(),
      imdbId: described.imdbId ?? null,
      title: described.title,
      year: described.year,
    };

    return asked.json(
      await streaming.service.offersFor(title, asked.req.valid('query').fresh === 'true'),
      200,
    );
  });

  app.openapi(playStreamRoute, async (asked) => {
    const headers = asked.req.raw.headers;
    const viewer = await viewerOf(headers);

    if (viewer === null) {
      return asked.json(NOBODY, 401);
    }

    if (streaming === null || !(await requires(headers, 'sources.play'))) {
      return asked.json(NOT_ALLOWED, 403);
    }

    try {
      const played = await streaming.service.play(asked.req.valid('json').streamId, viewer);

      return played === null
        ? asked.json(refuse('error.streams.thatStreamIsNoLongerOffered'), 410)
        : asked.json(played, 200);
    } catch (error) {
      if (error instanceof StreamRefusal) {
        return error.problem === 'unreadable'
          ? asked.json(refuseWith(error.said), 403)
          : asked.json({ ...refuseWith(error.said), problem: error.problem }, 409);
      }

      if (error instanceof SaidError) {
        return asked.json(
          { ...refuseWith(error.said), problem: 'sourceUnreachable' as const },
          409,
        );
      }

      if (error instanceof TranscoderError || error instanceof PinnedRequestRefusal) {
        return asked.json(
          {
            ...refuse('error.streams.theFilmCouldNotBeReadFrom'),
            problem: 'sourceUnreachable' as const,
          },
          409,
        );
      }

      throw error;
    }
  });

  app.openapi(readStreamedLibraryRoute, async (asked) => {
    if ((await viewerOf(asked.req.raw.headers)) === null) {
      return asked.json(NOBODY, 401);
    }

    return streaming === null
      ? asked.json(NOT_ALLOWED, 403)
      : asked.json({ libraryId: await streaming.libraryId() }, 200);
  });
};

export { serveStreams };
