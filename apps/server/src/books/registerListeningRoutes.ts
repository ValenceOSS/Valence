import { say } from '@ValenceI18n/say';
import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';
import {
  forgetListeningRoute,
  listListeningRoute,
  readListeningRoute,
  saveListeningRoute,
  streamChapterAudioRoute,
} from '@ValenceServer/routes/ListeningRoute';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { BookFormat } from '@ValenceContracts/schemas/Book';
import type { TranscoderStreamedFile } from '@ValenceServer/transcoder/TranscoderClient';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { BookService } from './createDatabaseBookService';

type ListeningRouteOptions = {
  books: BookService;
  viewerOf: (headers: Headers) => Promise<Viewer | null>;
  profileOf: (headers: Headers) => Promise<string | null>;
  isInReach: (headers: Headers, bookId: string, chapterId?: string) => Promise<boolean>;
  streamFile: (path: string, range: string | null) => Promise<TranscoderStreamedFile | null>;
};

const SOUNDS: Partial<Record<BookFormat, string>> = {
  m4b: 'audio/mp4',
  m4a: 'audio/mp4',
  aac: 'audio/mp4',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  flac: 'audio/flac',
};

/**
 * Serves listening to an audiobook: each of its tracks from anywhere in it, as a browser's audio
 * element asks — a range at a time, so moving through a twenty-hour book costs nothing — and where
 * each profile has got to, a place a book, so a listener carries on from any device.
 *
 * A track is named by the kind of sound it is rather than by whatever the file serving it guesses,
 * since an m4b is AAC in an MP4 however little a file server knows the name.
 *
 * @param app - The application to add the routes to.
 * @param options - The books, who is asking and whether they may, and how a file is read.
 */
const registerListeningRoutes = (
  app: OpenAPIHono,
  { books, viewerOf, profileOf, isInReach, streamFile }: ListeningRouteOptions,
): void => {
  app.openapi(streamChapterAudioRoute, async (context) => {
    const { bookId, chapterId } = context.req.valid('param');

    if ((await viewerOf(context.req.raw.headers)) === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const file = (await isInReach(context.req.raw.headers, bookId, chapterId))
      ? await books.readChapterFile(chapterId)
      : null;

    if (file === null || !isAudiobookFormat(file.format)) {
      return context.json({ error: say('server.errors.noSuchTrackToListenTo') }, 404);
    }

    const streamed = await streamFile(file.path, context.req.header('range') ?? null);

    if (streamed === null) {
      return context.json({ error: say('server.errors.trackUnreadable') }, 404);
    }

    const headers: Record<string, string> = {
      'content-type': SOUNDS[file.format] ?? streamed.contentType,
      'accept-ranges': 'bytes',
      'cache-control': 'private, max-age=3600',
    };

    if (streamed.contentRange !== null) {
      headers['content-range'] = streamed.contentRange;
    }

    if (streamed.contentLength !== null) {
      headers['content-length'] = streamed.contentLength;
    }

    return context.body(streamed.body, streamed.status === 206 ? 206 : 200, headers);
  });

  app.openapi(saveListeningRoute, async (context) => {
    const profileId = await profileOf(context.req.raw.headers);
    const { bookId } = context.req.valid('param');
    const where = context.req.valid('json');

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const isSaved =
      (await isInReach(context.req.raw.headers, bookId, where.chapterId)) &&
      (await books.saveListening(profileId, bookId, where));

    return isSaved
      ? context.body(null, 204)
      : context.json({ error: say('server.errors.noSuchTrackInBook') }, 404);
  });

  app.openapi(readListeningRoute, async (context) => {
    const profileId = await profileOf(context.req.raw.headers);
    const { bookId } = context.req.valid('param');

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json(
      {
        progress: (await isInReach(context.req.raw.headers, bookId))
          ? await books.readListening(profileId, bookId)
          : null,
      },
      200,
    );
  });

  app.openapi(listListeningRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);
    const profileId = await profileOf(context.req.raw.headers);

    if (viewer === null || profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json(
      {
        listenings: await books.listListening(viewer, profileId, context.req.valid('query').limit),
      },
      200,
    );
  });

  app.openapi(forgetListeningRoute, async (context) => {
    const profileId = await profileOf(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    await books.forgetListening(profileId, context.req.valid('param').bookId);

    return context.body(null, 204);
  });
};

export { registerListeningRoutes };
