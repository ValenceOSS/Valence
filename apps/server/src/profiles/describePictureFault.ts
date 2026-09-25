import { say } from '@ValenceI18n/say';
import { FACE_LIMITS } from './whatIsWrongWithThePicture';
import type { PictureFault, PictureLimits } from './whatIsWrongWithThePicture';

const STATUS: Record<PictureFault, 400 | 404 | 413> = {
  notAPicture: 400,
  tooLarge: 413,
  tooDetailed: 400,
  unreadable: 400,
  notYours: 404,
};

/**
 * Turns a refusal into the sentence somebody reads and the answer a client gets.
 *
 * Kept apart from the deciding so that the same refusal reads the same wherever a picture is
 * uploaded, and so that the limits are named once rather than written out again in prose that drifts
 * away from them.
 *
 * @param fault - What was wrong with the picture.
 * @param limits - The limits it was judged against, so that the sentence names the ones that
 *   applied; a face's by default.
 * @returns What to say, and what to answer with.
 */
const describePictureFault = (
  fault: PictureFault,
  limits: PictureLimits = FACE_LIMITS,
): { error: string; status: 400 | 404 | 413 } => {
  const megabytes = (limits.mostBytes / (1024 * 1024)).toString();
  const edge = limits.mostPixelsAnEdge.toString();

  const said: Record<PictureFault, string> = {
    notAPicture: say('server.pictures.notAPicture'),
    tooLarge: say('server.pictures.tooLarge', { megabytes }),
    tooDetailed: say('server.pictures.tooDetailed', { edge }),
    unreadable: say('server.pictures.unreadable'),
    notYours: say('server.errors.noSuchProfileOnAccount'),
  };

  return { error: said[fault], status: STATUS[fault] };
};

export { describePictureFault };
