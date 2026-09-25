import { requireOptionalNativeModule } from 'expo';

type WebSignIn = {
  signInOnTheWeb: (address: string) => Promise<string | null>;
};

/**
 * Opens a page of this Valence in the system's browser sheet and waits for it to send the sheet back
 * to the app.
 *
 * @param address - The whole address of the page to open.
 * @returns Where the page sent the sheet, or null where somebody closed it first. Rejects where the
 *   sheet could not be opened, or where this build has no Swift to open it with.
 */
const signInOnTheWeb = async (address: string): Promise<string | null> => {
  const sheet = requireOptionalNativeModule<WebSignIn>('ValenceWebSignIn');

  if (sheet === null) {
    throw new Error('This build cannot open the browser sheet.');
  }

  return sheet.signInOnTheWeb(address);
};

export { signInOnTheWeb };
