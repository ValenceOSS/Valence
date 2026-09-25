import { say } from '@ValenceI18n/say';

/**
 * What somebody can do about an empty screen, said the same way on every client: an admin is told
 * what to do, anybody else who to ask.
 *
 * @param missing - What is empty: there are no libraries at all, every library is empty, or the one
 *   being looked at is.
 * @param canManage - Whether whoever is looking can change the libraries themselves.
 * @returns The line to put under the title.
 */
const howToFillIt = (
  missing: 'no libraries' | 'every library' | 'one library',
  canManage: boolean,
): string => {
  if (missing === 'no libraries') {
    return canManage ? say('client.howToFillIt.addOne') : say('client.howToFillIt.askToAdd');
  }

  if (missing === 'every library') {
    return canManage ? say('client.howToFillIt.scanAll') : say('client.howToFillIt.askToScanAll');
  }

  return canManage ? say('client.howToFillIt.scanOne') : say('client.howToFillIt.askToScanOne');
};

export { howToFillIt };
