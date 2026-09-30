import {
  listSubtitlesRoute,
  readSubtitleCuesRoute,
  readSubtitleRoute,
} from '@ValenceServer/routes/SubtitleRoute';
import { shiftSubtitleCues } from '@ValenceCore/functions/shiftSubtitleCues';
import { shiftWebVtt } from '@ValenceCore/functions/shiftWebVtt';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the subtitle endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveSubtitle = (app: OpenAPIHono, context: AppContext): void => {
  const { subtitles } = context;

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

    const track = await subtitles.read(mediaId, trackId);

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

    const cues = await subtitles.readCues(mediaId, trackId);

    if (cues === null) {
      return context.json(refuse('error.subtitle.thatTrackCarriesNoStylingOf'), 404);
    }

    return context.json({ cues: shiftSubtitleCues(cues, from) }, 200);
  });
};

export { serveSubtitle };
