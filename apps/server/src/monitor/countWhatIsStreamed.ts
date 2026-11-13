import type { OpenAPIHono } from '@hono/zod-openapi';
import type { StreamMeter } from '@ValenceServer/monitor/createStreamMeter';

const STREAMED_PATHS = [
  '/api/playback/session/:sessionId/:name',
  '/api/playback/cast/:ticket/:name',
  '/api/playback/:mediaId/file',
  '/api/music/tracks/:trackId/stream',
  '/api/books/:bookId/chapters/:chapterId/audio',
  '/api/live/relay/:channelId',
  '/api/live/session/:liveId/:name',
  '/api/live/relayed/:channelId/:token/*',
  '/api/downloads/:id/file',
] as const;

/**
 * Puts the stream meter in front of every endpoint that sends viewers what they watch, hear or keep.
 *
 * @param app - The application.
 * @param meter - The meter, or nothing where nobody is counting.
 */
const countWhatIsStreamed = (app: OpenAPIHono, meter: StreamMeter | undefined): void => {
  if (meter === undefined) {
    return;
  }

  for (const path of STREAMED_PATHS) {
    app.use(path, meter.count);
  }
};

export { countWhatIsStreamed };
