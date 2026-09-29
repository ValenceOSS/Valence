import { BrowserWindow, ipcMain, shell } from 'electron';
import { z } from 'zod';
import { askWindowsForAPasskey } from '@ValenceDesktop/main/askWindowsForAPasskey';
import { haveWindowsMakeAPasskey } from '@ValenceDesktop/main/haveWindowsMakeAPasskey';
import { signInOnAPage } from '@ValenceDesktop/main/signInOnAPage';
import { theServerAddress } from '@ValenceDesktop/main/theServerAddress';
import {
  ADD_ONE_IN_THE_BROWSER,
  ASK_FOR_A_PASSKEY,
  MAKE_A_PASSKEY,
  SIGN_IN_ON_A_PAGE,
} from '@ValenceDesktop/main/passkeyChannels';
import { PasskeyCreationOptionsSchema } from '@ValenceContracts/schemas/PasskeyCreationOptions';
import { PasskeyRequestOptionsSchema } from '@ValenceContracts/schemas/PasskeyRequestOptions';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const ChallengeSchema = z.string().regex(/^[0-9a-f]{64}$/u);

const ProfileSchema = z.string().min(1).nullable().catch(null);

const NO_SERVER = { kind: 'failed', reason: 'No Valence has been chosen yet.' } as const;

const NO_WINDOW = { kind: 'failed', reason: 'The window asking has gone.' } as const;

const NOT_UNDERSTOOD = {
  kind: 'failed',
  reason: 'Valence asked for a passkey in a way this app does not understand.',
} as const;

/**
 * Lets the window ask for a passkey the only ways this client can: from Windows itself, or on the
 * server's own sign-in page.
 *
 * Every question is read through a schema on the way in, because it arrives from a page, and every
 * answer says what came of it rather than throwing — a throw reaches the window wrapped in words
 * about remote methods. Each prompt belongs to the window that asked, so the system draws it there.
 */
const answerAboutPasskeys = (): void => {
  ipcMain.handle(ASK_FOR_A_PASSKEY, async (event, said: JsonValue) => {
    const options = PasskeyRequestOptionsSchema.safeParse(said);
    const window = BrowserWindow.fromWebContents(event.sender);
    const server = theServerAddress();

    if (!options.success) {
      return NOT_UNDERSTOOD;
    }

    if (window === null) {
      return NO_WINDOW;
    }

    return server === ''
      ? NO_SERVER
      : await askWindowsForAPasskey(window.getNativeWindowHandle(), options.data, server);
  });

  ipcMain.handle(MAKE_A_PASSKEY, async (event, said: JsonValue) => {
    const options = PasskeyCreationOptionsSchema.safeParse(said);
    const window = BrowserWindow.fromWebContents(event.sender);
    const server = theServerAddress();

    if (!options.success) {
      return NOT_UNDERSTOOD;
    }

    if (window === null) {
      return NO_WINDOW;
    }

    return server === ''
      ? NO_SERVER
      : await haveWindowsMakeAPasskey(window.getNativeWindowHandle(), options.data, server);
  });

  ipcMain.handle(SIGN_IN_ON_A_PAGE, async (event, challenge: JsonValue, profileId: JsonValue) => {
    const asked = ChallengeSchema.safeParse(challenge);
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!asked.success) {
      return NOT_UNDERSTOOD;
    }

    return window === null
      ? NO_WINDOW
      : await signInOnAPage(window, asked.data, ProfileSchema.parse(profileId));
  });

  ipcMain.on(ADD_ONE_IN_THE_BROWSER, () => {
    const server = theServerAddress();

    if (server !== '') {
      void shell.openExternal(new URL('/?account=security', server).toString());
    }
  });
};

export { answerAboutPasskeys };
