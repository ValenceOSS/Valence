import {
  listRatingsRoute,
  rateMediaRoute,
  clearMediaRatingRoute,
  readMediaHouseholdRatingRoute,
  rateSeriesRoute,
  clearSeriesRatingRoute,
  readSeriesHouseholdRatingRoute,
  rateBookRoute,
  clearBookRatingRoute,
  readBookHouseholdRatingRoute,
} from '@ValenceServer/routes/RatingRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the rating endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveRating = (app: OpenAPIHono, context: AppContext): void => {
  const { library, ratings, bookInReach, readProfileId } = context;

  app.openapi(listRatingsRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ ratings: await ratings.list(profileId) }, 200);
  });

  app.openapi(rateMediaRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { mediaId } = context.req.valid('param');

    if ((await library.getMedia(mediaId)) === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    await ratings.set(profileId, { mediaId }, context.req.valid('json').stars);

    return context.body(null, 204);
  });

  app.openapi(clearMediaRatingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await ratings.clear(profileId, { mediaId: context.req.valid('param').mediaId });

    return context.body(null, 204);
  });

  app.openapi(readMediaHouseholdRatingRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { mediaId } = context.req.valid('param');

    if ((await library.getMedia(mediaId)) === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    return context.json(await ratings.household({ mediaId }), 200);
  });

  app.openapi(rateSeriesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { seriesId } = context.req.valid('param');

    if ((await library.getSeries(seriesId)) === null) {
      return context.json({ error: 'No such programme.' }, 404);
    }

    await ratings.set(profileId, { seriesId }, context.req.valid('json').stars);

    return context.body(null, 204);
  });

  app.openapi(clearSeriesRatingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await ratings.clear(profileId, { seriesId: context.req.valid('param').seriesId });

    return context.body(null, 204);
  });

  app.openapi(readSeriesHouseholdRatingRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { seriesId } = context.req.valid('param');

    if ((await library.getSeries(seriesId)) === null) {
      return context.json({ error: 'No such programme.' }, 404);
    }

    return context.json(await ratings.household({ seriesId }), 200);
  });

  app.openapi(rateBookRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { bookId } = context.req.valid('param');

    if (!(await bookInReach(context.req.raw.headers, bookId))) {
      return context.json({ error: 'No such book.' }, 404);
    }

    await ratings.set(profileId, { bookId }, context.req.valid('json').stars);

    return context.body(null, 204);
  });

  app.openapi(clearBookRatingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await ratings.clear(profileId, { bookId: context.req.valid('param').bookId });

    return context.body(null, 204);
  });

  app.openapi(readBookHouseholdRatingRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { bookId } = context.req.valid('param');

    if (!(await bookInReach(context.req.raw.headers, bookId))) {
      return context.json({ error: 'No such book.' }, 404);
    }

    return context.json(await ratings.household({ bookId }), 200);
  });
};

export { serveRating };
