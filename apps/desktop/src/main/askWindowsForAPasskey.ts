import { z } from 'zod';
import { aClientData } from '@ValenceDesktop/main/aClientData';
import { PASSKEY_TIMEOUT } from '@ValenceDesktop/main/passkeyTimeout';
import { theNativeModule } from '@ValenceDesktop/main/theNativeModule';
import { whatWindowsSaid } from '@ValenceDesktop/main/whatWindowsSaid';
import type { AskReply } from '@ValenceDesktop/main/AskReply';
import type { PasskeyRequestOptions } from '@ValenceContracts/schemas/PasskeyRequestOptions';
import { say } from '@ValenceI18n/say';

const AnswerSchema = z.object({
  credentialId: z.instanceof(Buffer),
  authenticatorData: z.instanceof(Buffer),
  signature: z.instanceof(Buffer),
  userHandle: z.instanceof(Buffer).nullish(),
});

/**
 * Asks Windows for a passkey to sign in with, over the given window: Windows Hello, a phone, a
 * security key, or whatever passkey manager has put itself in Windows' list.
 *
 * The ceremony a browser on the server's own page would run, run by Windows instead, because the
 * browser engine refuses one from a window whose address is not the server's.
 *
 * @param window - The window the prompt belongs to, as Electron hands it over.
 * @param options - What the server asked for.
 * @param server - Where the server is.
 * @returns What was signed, that somebody cancelled, or why it failed.
 */
const askWindowsForAPasskey = async (
  window: Buffer,
  options: PasskeyRequestOptions,
  server: string,
): Promise<AskReply> => {
  const ask = theNativeModule().askForAPasskey;

  if (ask === undefined) {
    return {
      kind: 'failed',
      reason: say('desktop.main.askWindowsForAPasskey.thisBuildCannotAskWindowsFor'),
    };
  }

  const clientData = aClientData('webauthn.get', options.challenge, server);

  try {
    const answer = AnswerSchema.parse(
      await ask(window, {
        rpId: options.rpId ?? new URL(server).hostname,
        clientDataJson: clientData,
        allow: (options.allowCredentials ?? []).map(({ id }) => Buffer.from(id, 'base64url')),
        userVerification: options.userVerification ?? 'preferred',
        timeoutMs: options.timeout ?? PASSKEY_TIMEOUT,
      }),
    );
    const id = answer.credentialId.toString('base64url');
    const userHandle = answer.userHandle?.toString('base64url') ?? '';

    return {
      kind: 'done',
      done: {
        id,
        rawId: id,
        type: 'public-key',
        response: {
          clientDataJSON: Buffer.from(clientData).toString('base64url'),
          authenticatorData: answer.authenticatorData.toString('base64url'),
          signature: answer.signature.toString('base64url'),
          ...(userHandle === '' ? {} : { userHandle }),
        },
      },
    };
  } catch (error) {
    return whatWindowsSaid(error instanceof Error ? error : null);
  }
};

export { askWindowsForAPasskey };
