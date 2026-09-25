import {
  askForDownloadRoute,
  askForSeriesRoute,
  forgetDownloadRoute,
  holdDownloadRoute,
  listDownloadsRoute,
  listHoldingsRoute,
  offerDownloadRoute,
  offerSeriesRoute,
  pauseDownloadRoute,
  readDownloadRoute,
  releaseDownloadRoute,
  resumeDownloadRoute,
} from '@ValenceServer/routes/DownloadRoute';
import { asAnAttachment } from '@ValenceServer/downloads/asAnAttachment';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppContext } from '@ValenceServer/api/AppContext';

/**
 * Registers the endpoints for keeping a film to watch offline: what it would cost, asking for it to
 * be prepared, following it, fetching or saving the file, and saying which devices hold a copy.
 *
 * The device that asks is remembered, from the client header every client sends, so that device can
 * fetch the file by itself once it is ready.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveDownloads = (app: OpenAPIHono, context: AppContext): void => {
  const { downloads, readProfileId, forwardedFileHeaders } = context;

  if (downloads === undefined) {
    return;
  }

  app.openapi(offerDownloadRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const offer = await downloads.offer(
      context.req.valid('param').mediaId,
      context.req.valid('json').deviceProfile,
    );

    return offer === null
      ? context.json({ error: 'No such media item.' }, 404)
      : context.json(offer, 200);
  });

  app.openapi(askForDownloadRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { quality, audioLanguages } = context.req.valid('json');

    const asked = await downloads.ask(
      profileId,
      context.req.header('x-valence-client') ?? null,
      context.req.valid('param').mediaId,
      quality,
      audioLanguages ?? [],
    );

    return asked === null
      ? context.json({ error: 'No such media item.' }, 404)
      : context.json(asked, 200);
  });

  app.openapi(offerSeriesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { deviceProfile, mediaIds } = context.req.valid('json');
    const offer = await downloads.offerSeries(
      context.req.valid('param').seriesId,
      deviceProfile,
      mediaIds,
    );

    return offer === null
      ? context.json({ error: 'No such programme.' }, 404)
      : context.json(offer, 200);
  });

  app.openapi(askForSeriesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { quality, audioLanguages, mediaIds } = context.req.valid('json');

    const queued = await downloads.askForSeries(
      profileId,
      context.req.header('x-valence-client') ?? null,
      context.req.valid('param').seriesId,
      quality,
      audioLanguages ?? [],
      mediaIds,
    );

    return context.json({ downloads: queued }, 200);
  });

  app.openapi(pauseDownloadRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await downloads.pause(profileId, context.req.valid('param').id);

    return context.body(null, 204);
  });

  app.openapi(resumeDownloadRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await downloads.resume(profileId, context.req.valid('param').id);

    return context.body(null, 204);
  });

  app.openapi(listDownloadsRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ downloads: await downloads.list(profileId) }, 200);
  });

  app.openapi(forgetDownloadRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await downloads.forget(profileId, context.req.valid('param').id);

    return context.body(null, 204);
  });

  app.openapi(readDownloadRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const found = await downloads.readFile(
      profileId,
      context.req.valid('param').id,
      context.req.header('range') ?? null,
    );

    if (found === null) {
      return context.json({ error: 'Nothing prepared under that name.' }, 404);
    }

    const { file, title } = found;

    return context.body(
      file.body,
      file.status === 206 ? 206 : 200,
      forwardedFileHeaders(
        file,
        context.req.valid('query').save === undefined
          ? {}
          : { 'content-disposition': asAnAttachment(title) },
      ),
    );
  });

  app.openapi(listHoldingsRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ holdings: await downloads.held(profileId) }, 200);
  });

  app.openapi(holdDownloadRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const clientId = context.req.header('x-valence-client') ?? profileId;

    await downloads.hold(
      profileId,
      clientId,
      context.req.valid('param').mediaId,
      context.req.valid('json').quality,
    );

    return context.body(null, 204);
  });

  app.openapi(releaseDownloadRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { mediaId, quality } = context.req.valid('param');
    const clientId = context.req.header('x-valence-client') ?? profileId;

    await downloads.release(profileId, clientId, mediaId, quality);

    return context.body(null, 204);
  });
};

export { serveDownloads };
