import { withAlpha } from '@ValenceCore/functions/withAlpha';

const SUBTLE = 0.06;

/**
 * What sits behind a face, as the web draws it: the profile's colour behind an initial, and a faint
 * wash of the text colour behind a picture, so a drawn face reads the same on every client.
 *
 * @param colour - The profile's colour.
 * @param isShowingAPicture - Whether a picture is drawn over it rather than the initial.
 * @param text - The colour text is drawn in, which the wash is made from.
 * @returns The colour to draw behind it.
 */
const backdropOfAFace = (colour: string, isShowingAPicture: boolean, text: string): string =>
  isShowingAPicture ? withAlpha(text, SUBTLE) : colour;

export { backdropOfAFace };
