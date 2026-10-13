import { ARing } from '@ValenceMobile/components/ASpinner/components/ARing/ARing';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ASpinnerProps } from './ASpinner.types';

/**
 * Valence's own loading mark, as the web draws it: eight short segments round a ring, lighting one
 * by one until it is full and then going dark from where they began. Told the wait is over, it
 * fills the rest of the ring quickly and says so once it is whole.
 *
 * @param colour - The colour of the lit segments, the page's quieter text unless told otherwise.
 */
const ASpinner = ({ colour, ...rest }: ASpinnerProps) => {
  const colours = useTheColours();

  return <ARing colour={colour ?? colours.textMuted} {...rest} />;
};

ASpinner.displayName = 'ASpinner';

export { ASpinner };
