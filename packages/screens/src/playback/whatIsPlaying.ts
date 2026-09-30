import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type WhatIsPlaying = Partial<Pick<MediaSummary, 'seriesTitle' | 'extraKind'>>;

/**
 * What kind of thing is on screen, for the sentences that have to name it.
 *
 * "Waiting for more of the film" said of a half-hour sitcom is wrong in the one place a viewer is
 * already annoyed, so the sentence follows the item rather than the library it was written for. An
 * episode carries the series it belongs to; an extra is a trailer or a featurette and has no good
 * noun of its own, so it is called what is on screen rather than guessed at.
 *
 * @param media - What is playing.
 * @returns Whether it is an extra, an episode or a film, which picks the sentence that names it.
 */
const whatIsPlaying = ({ seriesTitle, extraKind }: WhatIsPlaying): 'extra' | 'episode' | 'film' => {
  if (extraKind !== null && extraKind !== undefined) {
    return 'extra';
  }

  return seriesTitle !== null && seriesTitle !== undefined && seriesTitle !== ''
    ? 'episode'
    : 'film';
};

export type { WhatIsPlaying };

export { whatIsPlaying };
