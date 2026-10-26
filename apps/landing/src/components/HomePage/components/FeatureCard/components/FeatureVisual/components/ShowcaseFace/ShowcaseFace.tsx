import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';
import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import { SHOWCASE_COLOURS } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/SHOWCASE_COLOURS';
import { NOBODYS_COLOUR } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/NOBODYS_COLOUR';
import type { ShowcaseFaceProps } from './ShowcaseFace.types';

/**
 * Somebody in the made-up household the landing shows, drawn by the app's own face: their initial
 * on their colour, as the app draws anybody without a picture.
 *
 * @param name - Whose face it is.
 * @param isLifted - Whether it sits raised off the page, as the faces on the way in do.
 * @param className - Extra classes for the caller's own layout.
 */
const ShowcaseFace = ({ name, isLifted = false, className }: ShowcaseFaceProps) => (
  <FaceCircle
    name={name}
    colour={SHOWCASE_COLOURS[name] ?? NOBODYS_COLOUR}
    avatar={{ kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED }}
    source=""
    isLifted={isLifted}
    {...(className === undefined ? {} : { className })}
  />
);

ShowcaseFace.displayName = 'ShowcaseFace';

export { ShowcaseFace };
