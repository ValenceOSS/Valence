import { namePlaying } from '@ValenceClient/playback/namePlaying';
import type { Playing } from '@ValenceClient/playback/namePlaying';

/**
 * Names what is playing as one line, with the year it is from bracketed after it, because the year
 * qualifies the thing immediately before it rather than standing as a fact of its own.
 *
 * @param media - What is playing.
 * @returns What to call it.
 */
const describePlaying = (media: Playing): string => {
  const { name, year } = namePlaying(media);

  return year === null ? name : `${name} (${year.toString()})`;
};

export { describePlaying };
