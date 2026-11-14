import {
  listSubtitleFontsRoute,
  listSubtitlesRoute,
  readSubtitleCuesRoute,
  readSubtitleFontRoute,
  readSubtitleRoute,
  readSubtitleScriptRoute,
} from '@ValenceServer/routes/SubtitleRoute';
import { shiftSubtitleCues } from '@ValenceCore/functions/shiftSubtitleCues';
import { shiftWebVtt } from '@ValenceCore/functions/shiftWebVtt';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the subtitle endpoints, the scripts styled tracks are drawn from and the fonts they
 * carry among them.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveSubtitle = (app: OpenAPIHono, context: AppContext): void => {
  const { subtitles, subtitleFonts } = context;

  /**
   * Reads a track, telling a read that failed for a reason that is no answer about the track, such
   * as the media service being out of reach, apart from a track that has nothing to give.
   *
   * @param read - The read.
   * @returns What it read, or that it failed.
   */
  const attempt = async <T>(read: () => Promise<T>): Promise<{ read: T } | { failure: true }> => {
    try {
      return { read: await read() };
    } catch {
      return { failure: true };
    }
  };

  app.openapi(listSubtitlesRoute, async (context) => {
    const tracks = await subtitles.list(context.req.valid('param').mediaId);

    if (tracks === null) {
      return context.json(refuse('error.common.noSuchMediaItem'), 404);
    }

    return context.json({ tracks }, 200);
  });

  app.openapi(readSubtitleRoute, async (context) => {
    const { mediaId, trackId } = context.req.valid('param');
    const { from } = context.req.valid('query');

    const attempted = await attempt(() => subtitles.read(mediaId, trackId));

    if ('failure' in attempted) {
      return context.json(refuse('error.subtitle.couldNotBeReadJustNow'), 503);
    }

    const track = attempted.read;

    if (track === null) {
      return context.json(refuse('error.common.noSuchTrack'), 404);
    }

    return context.body(shiftWebVtt(track, from), 200, {
      'content-type': 'text/vtt; charset=utf-8',
    });
  });

  app.openapi(readSubtitleCuesRoute, async (context) => {
    const { mediaId, trackId } = context.req.valid('param');
    const { from } = context.req.valid('query');

    const attempted = await attempt(() => subtitles.readCues(mediaId, trackId));

    if ('failure' in attempted) {
      return context.json(refuse('error.subtitle.couldNotBeReadJustNow'), 503);
    }

    const cues = attempted.read;

    if (cues === null) {
      return context.json(refuse('error.subtitle.thatTrackCarriesNoStylingOf'), 404);
    }

    return context.json({ cues: shiftSubtitleCues(cues, from) }, 200);
  });

  app.openapi(readSubtitleScriptRoute, async (context) => {
    const { mediaId, trackId } = context.req.valid('param');

    const attempted = await attempt(() => subtitles.readScript(mediaId, trackId));

    if ('failure' in attempted) {
      return context.json(refuse('error.subtitle.couldNotBeReadJustNow'), 503);
    }

    const script = attempted.read;

    if (script === null) {
      return context.json(refuse('error.subtitle.thatTrackCarriesNoStylingOf'), 404);
    }

    return context.body(script, 200, { 'content-type': 'text/plain; charset=utf-8' });
  });

  app.openapi(listSubtitleFontsRoute, async (context) => {
    const { mediaId } = context.req.valid('param');

    return context.json({ fonts: (await subtitleFonts?.list(mediaId).catch(() => [])) ?? [] }, 200);
  });

  app.openapi(readSubtitleFontRoute, async (context) => {
    const { mediaId, name } = context.req.valid('param');

    const font = (await subtitleFonts?.read(mediaId, name).catch(() => null)) ?? null;

    if (font === null) {
      return context.json(refuse('error.subtitle.noSuchFont'), 404);
    }

    return context.body(font, 200, {
      'content-type': 'application/octet-stream',
      'cache-control': 'private, max-age=86400',
    });
  });
};

export { serveSubtitle };
