import { useLetterNudge } from '@ValenceScreens/library/useLetterNudge';
import type { FaceLetterProps } from './FaceLetter.types';

/**
 * The letter on a face, moved from where the browser sets it to where it looks centred in its
 * circle, whatever the font and whatever the letter.
 *
 * @param letter - The letter.
 * @param family - The font it is set in, as CSS names it.
 * @param weight - How heavy it is set.
 */
const FaceLetter = ({ letter, family, weight }: FaceLetterProps) => {
  const nudge = useLetterNudge(letter, family, weight);

  return (
    <span
      aria-hidden
      className="inline-block"
      style={
        nudge === null
          ? undefined
          : { transform: `translate(${nudge.x.toFixed(4)}em, ${nudge.y.toFixed(4)}em)` }
      }
    >
      {letter}
    </span>
  );
};

FaceLetter.displayName = 'FaceLetter';

export { FaceLetter };
