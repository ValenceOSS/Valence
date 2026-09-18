import { QrCode } from '@ValenceUI/QrCode';
import { whereToTypeTheCode } from '@ValenceScreens/session/whereToTypeTheCode';
import { Spinner } from '@ValenceUI/Spinner';
import type { FinishOnAnotherDeviceProps } from './FinishOnAnotherDevice.types';

/**
 * What a television shows instead of the setting-up form, which asks for a name and a picture and
 * is the last thing anybody wants to do with a remote.
 *
 * There is nothing to approve here and no code to read: whoever is signed in is signed in
 * everywhere, so opening Valence on a phone lands on the same three steps with a keyboard under
 * them. This screen is the waiting, and it ends by itself — the household is asked about again
 * while this is up, so finishing on the phone opens the television without anybody touching it.
 *
 * @param name - What this instance is called.
 * @param address - The address this server is reached at.
 */
const FinishOnAnotherDevice = ({ name, address }: FinishOnAnotherDeviceProps) => (
  <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-center justify-center gap-8 px-8 text-center">
    <header className="flex flex-col gap-3">
      <h1 className="text-3xl font-medium text-text">Finish setting up on your phone</h1>

      <p className="text-base text-text-muted">
        {name} needs a name and a picture, and a remote is a poor way to give it either. Open this
        on your phone and this television will carry on by itself.
      </p>
    </header>

    <QrCode value={address} label="Open this on your phone" size={200} />

    <p className="text-base text-text-muted">{whereToTypeTheCode(address)}</p>

    <Spinner label="Waiting for you to finish" />
  </main>
);

FinishOnAnotherDevice.displayName = 'FinishOnAnotherDevice';

export { FinishOnAnotherDevice };
