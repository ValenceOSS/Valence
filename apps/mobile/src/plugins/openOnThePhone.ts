import { BACK_IN_THE_APP } from '@ValenceContracts/constants/BACK_IN_THE_APP';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { signInOnTheWeb } from '@ValenceMobile/platform/signInOnTheWeb';

/**
 * Opens a page of this Valence that a plugin page sent somebody to, such as the sign-in page of an
 * outside account being connected, in the system's browser sheet, and waits for it to close. Only
 * a path on this server is ever opened: the server decides where it leads, never the plugin. A
 * password for another service is typed into that service's own page, never into Valence.
 *
 * The page is asked to come back to the app once it is done, which closes the sheet by itself.
 *
 * @param path - The path on this server.
 * @returns Once the sheet has closed, however it closed.
 */
const openOnThePhone = async (path: string): Promise<void> => {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return;
  }

  const address = new URL(onThisServer(path));

  address.searchParams.set('returnTo', BACK_IN_THE_APP);

  await signInOnTheWeb(address.toString()).catch(() => null);
};

export { openOnThePhone };
