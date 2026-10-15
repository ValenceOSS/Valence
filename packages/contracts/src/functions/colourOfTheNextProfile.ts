import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * The colour a new profile starts with, taken in turn so that each one added looks unlike the last.
 *
 * @param count - How many profiles the account holds already.
 * @returns The colour.
 */
const colourOfTheNextProfile = (count: number): ProfileColour =>
  PROFILE_COLOURS[count % PROFILE_COLOURS.length] ?? PROFILE_COLOURS[0];

export { colourOfTheNextProfile };
