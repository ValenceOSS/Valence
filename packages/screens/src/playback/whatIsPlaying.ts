import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

type WhatIsPlaying = Partial<Pick<MediaSummary, 'seriesTitle' | 'extraKind'>>;

/**
 * What to call whatever is on screen, for the sentences that have to name it.
 *
 * "Waiting for more of the film" said of a half-hour sitcom is wrong in the one place a viewer is
 * already annoyed, so the word follows the item rather than the library it was written for. An
 * episode carries the series it belongs to; an extra is a trailer or a featurette and has no good
 * noun of its own, so it is called what is on screen rather than guessed at.
 *
 * @param media - What is playing.
 * @returns The noun phrase, with its article, to drop into a sentence.
 */
const whatIsPlaying = ({ seriesTitle, extraKind }: WhatIsPlaying): string => {
  if (extraKind !== null && extraKind !== undefined) {
    return say('screens.whatIsPlaying.this');
  }

  return seriesTitle !== null && seriesTitle !== undefined && seriesTitle !== ''
    ? say('screens.whatIsPlaying.episode')
    : say('screens.whatIsPlaying.film');
};

export type { WhatIsPlaying };

export { whatIsPlaying };
