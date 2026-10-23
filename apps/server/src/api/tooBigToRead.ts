import { bodyLimit } from 'hono/body-limit';
import { bodyOf } from '@ValenceI18n/bodyOf';
import { describePictureFault } from '@ValenceServer/profiles/describePictureFault';
import { FACE_LIMITS } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { PictureLimits } from '@ValenceServer/profiles/whatIsWrongWithThePicture';

/**
 * Builds the guard that turns away a picture too big to keep before it has been read rather than
 * after.
 *
 * The size is checked again where the picture is judged, which is what makes the rule true; this is
 * only so that somebody uploading a film by mistake does not have it held in memory in full first.
 * It counts what arrives, so a picture sent without a length is held to the limit too.
 *
 * @param limits - The limits the picture is held to, a face's unless it is something drawn larger.
 * @returns The middleware to put in front of a route that takes a picture.
 */
const tooBigToRead = (limits: PictureLimits = FACE_LIMITS) =>
  bodyLimit({
    maxSize: limits.mostBytes,
    onError: (context) => context.json(bodyOf(describePictureFault('tooLarge', limits)), 413),
  });

export { tooBigToRead };
