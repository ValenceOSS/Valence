import { channelsOf } from '@ValenceCore/functions/channelsOf';

/**
 * A colour made see-through by so much, from the forms Valence writes its colours in — a hex
 * code, as a profile's colour is, or `rgb()`, as the web's house lights are — since the phone's
 * gradients cannot mix a colour into transparency the way a browser's can.
 *
 * @param colour - The colour.
 * @param alpha - How much of it shows, from nothing at 0 to all of it at 1.
 * @returns The colour as `rgba()`, or transparent where it could not be read.
 */
const withAlpha = (colour: string, alpha: number): string => {
  const channels = channelsOf(colour);

  if (channels === null) {
    return 'transparent';
  }

  return `rgba(${channels.join(', ')}, ${Math.min(Math.max(alpha, 0), 1).toString()})`;
};

export { withAlpha };
