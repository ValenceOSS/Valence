import { BACK_IN_THE_APP } from '@ValenceContracts/constants/BACK_IN_THE_APP';

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
    !asked.includes('\\')
    ? asked
    : '/';
};

export { whereToReturn };
