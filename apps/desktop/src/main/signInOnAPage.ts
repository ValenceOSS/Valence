import { app, shell } from 'electron';
import { listenForTheHandBack } from '@ValenceDesktop/main/listenForTheHandBack';
import { theServerAddress } from '@ValenceDesktop/main/theServerAddress';
import type { BrowserWindow } from 'electron';
import type { HandBackReply } from '@ValenceDesktop/main/HandBackReply';
import { say } from '@ValenceI18n/say';

type SigningInFrom = Pick<BrowserWindow, 'isDestroyed' | 'show' | 'focus'>;

/**
 * Signs somebody in with a passkey on the server's own sign-in page, in their own browser, and hands
 * back the code the page gives, for a desktop app that cannot ask its operating system for a passkey
 * on the server's behalf.
 *
 * The browser is whichever one they chose, so the passkeys they meet there are the ones they keep:
 * iCloud Keychain in Safari, or whatever password manager their browser carries. On a Mac, Apple lets
 * only a web browser use a passkey for any server it likes; Linux keeps its passkeys in the browser
 * anyway. The page hands the code back to a port this machine alone listens on, and the app comes
 * back to the front for them.
 *
 * @param window - The window somebody is signing in from.
 * @param challenge - What the page sends back with the code, made from a secret the window keeps.
 * @param profileId - The face somebody already chose, which the page asks for straight away.
 * @returns The code, that somebody cancelled, or why it failed.
 */
const signInOnAPage = async (
  window: SigningInFrom,
  challenge: string,
  profileId: string | null,
): Promise<HandBackReply> => {
  const server = theServerAddress();

  if (server === '') {
    return { kind: 'failed', reason: say('common.noValenceHasBeenChosenYet') };
  }

  const { port, handedBack } = await listenForTheHandBack();
  const page = new URL('/phone-sign-in', server);

  page.searchParams.set('challenge', challenge);

  if (profileId !== null) {
    page.searchParams.set('profile', profileId);
  }

  page.searchParams.set('port', port.toString());
  await shell.openExternal(page.toString());

  const code = await handedBack;

  if (code === null) {
    return { kind: 'cancelled' };
  }

  if (!window.isDestroyed()) {
    window.show();
    window.focus();
    app.focus({ steal: true });
  }

  return { kind: 'done', done: code };
};

export { signInOnAPage };
