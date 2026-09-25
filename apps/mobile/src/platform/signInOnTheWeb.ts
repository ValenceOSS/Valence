import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { signInInATab } from '@ValenceMobile/platform/signInInATab';

type WebSignIn = {
  signInOnTheWeb?: (address: string) => Promise<string | null>;
  openInATab?: (address: string) => Promise<void>;
};

/**
 * Opens a page of this Valence in the system's browser — the sheet on an iPhone, a Chrome tab on
 * Android — and waits for it to send the browser back to the app.
 *
 * @param address - The whole address of the page to open.
 * @returns Where the page sent the browser, or null where somebody closed it first. Rejects where
 *   it could not be opened, or where this build has no native code to open it with.
 */
const signInOnTheWeb = async (address: string): Promise<string | null> => {
  const opener = requireOptionalNativeModule<WebSignIn>('ValenceWebSignIn');

  if (Platform.OS === 'android' && opener?.openInATab !== undefined) {
    return signInInATab(address, opener.openInATab);
  }

  if (opener?.signInOnTheWeb === undefined) {
    throw new Error('This build cannot open the browser sheet.');
  }

  return opener.signInOnTheWeb(address);
};

export { signInOnTheWeb };
