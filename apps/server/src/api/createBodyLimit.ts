import { bodyLimit } from 'hono/body-limit';
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import { refuse } from '@ValenceI18n/refuse';
import { isPublicRoute } from '@ValenceServer/auth/isPublicRoute';
import { SMALL_BODY_BYTES } from '@ValenceServer/api/SMALL_BODY_BYTES';
import { MOST_FILE_BYTES } from '@ValenceServer/api/MOST_FILE_BYTES';

const STREAMED_TO_DISK = /^\/api\/libraries\/[^/]+\/uploads(\/|$)/u;

const READ_AS_TEXT = /^\s*(application\/([\w.-]+\+)?(json|x-www-form-urlencoded)|text\/)/iu;

const tooLarge = (context: Context) =>
  context.json(refuse('error.common.thatRequestIsTooLarge'), 413);

/**
 * Builds the guard that stops a request body growing past what anything here would read, counted as
 * it arrives so that a body sent without a length is held to the same limit as one that declares it.
 *
 * Sign-in and the rest of what answers without a session, and anything sent as JSON, a form or text,
 * get the small limit: those are read whole into memory to be parsed, and nothing honest sends more.
 * Anything else is a file, and is held to the largest file any route takes, which then holds it to
 * its own. A file uploaded into a library is written to disk as it arrives rather than held, so it
 * passes untouched.
 *
 * @returns The middleware.
 */
const createBodyLimit = () => {
  const small = bodyLimit({ maxSize: SMALL_BODY_BYTES, onError: tooLarge });
  const file = bodyLimit({ maxSize: MOST_FILE_BYTES, onError: tooLarge });

  return createMiddleware(async (context, next) => {
    const { method, path } = context.req;

    if (STREAMED_TO_DISK.test(path)) {
      await next();

      return undefined;
    }

    const type = context.req.header('content-type') ?? '';
    const isAFile = type.trim() !== '' && !READ_AS_TEXT.test(type);

    return isPublicRoute(method, path, true) || !isAFile
      ? small(context, next)
      : file(context, next);
  });
};

export { createBodyLimit };
