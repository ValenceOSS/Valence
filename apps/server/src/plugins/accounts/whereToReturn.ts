import { BACK_IN_THE_APP } from '@ValenceContracts/constants/BACK_IN_THE_APP';

/**
 * Whether a character is one a browser drops or reads as a break in an address.
 *
 * @param character - The character.
 * @returns Whether it is a control character.
 */
const isControl = (character: string): boolean => {
  const code = character.charCodeAt(0);

  return code < 0x20 || code === 0x7f;
};

/**
 * Where to send somebody back to after connecting an account: a path on this server, or the one
 * link that hands a phone's browser sheet back to the app, and nowhere else, whatever was asked for.
 *
 * @param asked - Where the client asked to come back to.
 * @returns A path on this server, or the app's own way back.
 */
const whereToReturn = (asked: string | undefined): string => {
  if (asked === BACK_IN_THE_APP) {
    return asked;
  }

  return asked !== undefined &&
    asked.startsWith('/') &&
    !asked.startsWith('//') &&
    !asked.includes('\\') &&
    ![...asked].some(isControl)
    ? asked
    : '/';
};

export { whereToReturn };
