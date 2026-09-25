import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { SignInATelevision } from '@ValenceMobile/components/TheAccount/components/TheDevices/components/SignInATelevision/SignInATelevision';
import type { ATelevisionToSignInProps } from './ATelevisionToSignIn.types';

/**
 * Signing in the television whose code was scanned with the phone's camera, opened straight from
 * the web page the camera led to, with the code already asked about.
 *
 * @param code - The code the television showed.
 * @param askedFrom - The server the television asked, where the link said.
 * @param onBack - Told somebody is done with it.
 */
const ATelevisionToSignIn = ({ code, askedFrom, onBack }: ATelevisionToSignInProps) => (
  <Screen scrolls onBack={onBack}>
    <SignInATelevision startsWith={code} askedFrom={askedFrom} />
  </Screen>
);

ATelevisionToSignIn.displayName = 'ATelevisionToSignIn';

export { ATelevisionToSignIn };
