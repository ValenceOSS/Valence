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
  missing: 'noLibraries' | 'everyLibrary' | 'oneLibrary',
  canManage: boolean,
): string => {
  if (missing === 'noLibraries') {
    return canManage ? say('common.addOneToGetStarted') : say('common.askTheServerAdminToAdd');
  }

  if (missing === 'everyLibrary') {
    return canManage
      ? say('client.library.howToFillIt.scanYourLibrariesOrAddFiles')
      : say('client.library.howToFillIt.askTheServerAdminToScan');
  }

  return canManage ? say('common.scanItOrAddFilesTo') : say('common.askTheServerAdminToScan');
};

export { howToFillIt };
