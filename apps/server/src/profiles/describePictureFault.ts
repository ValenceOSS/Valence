import { MOST_BYTES, MOST_PIXELS_AN_EDGE } from './whatIsWrongWithThePicture';
import type { PictureFault } from './whatIsWrongWithThePicture';

const MEGABYTES = MOST_BYTES / (1024 * 1024);

const EDGE = MOST_PIXELS_AN_EDGE.toString();

const SAID: Record<PictureFault, string> = {
  notAPicture: 'A picture has to be a JPEG, PNG, WebP, AVIF or GIF.',
  tooLarge: `A picture has to be ${MEGABYTES.toString()} MB or smaller.`,
  tooDetailed: `A picture has to be ${EDGE} by ${EDGE} or smaller.`,
  unreadable: 'That file could not be read as a picture.',
  notYours: 'No such profile on this account.',
};

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
 * @returns What to say, and what to answer with.
 */
const describePictureFault = (fault: PictureFault): { error: string; status: 400 | 404 | 413 } => ({
  error: SAID[fault],
  status: STATUS[fault],
});

export { describePictureFault };
