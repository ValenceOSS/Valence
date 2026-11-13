import { say } from '@ValenceI18n/say';
import { PROFILE_COLOUR_NAMES } from '@ValenceClient/profiles/PROFILE_COLOUR_NAMES';

/**
 * What a colour is called: its name where it is one of the ready colours, and its hex code where it
 * is one of somebody's own.
 *
 * @param colour - The colour, as `#rrggbb`.
 * @returns Its name.
 */
const colourName = (colour: string): string => {
  const found = Object.entries(PROFILE_COLOUR_NAMES).find(
    ([ready]) => ready === colour.toLowerCase(),
  );

  return found === undefined ? colour : say(found[1]);
};

export { colourName };
