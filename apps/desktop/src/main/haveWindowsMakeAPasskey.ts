import { z } from 'zod';
import { aClientData } from '@ValenceDesktop/main/aClientData';
import { PASSKEY_TIMEOUT } from '@ValenceDesktop/main/passkeyTimeout';
import { theNativeModule } from '@ValenceDesktop/main/theNativeModule';
import { whatWindowsSaid } from '@ValenceDesktop/main/whatWindowsSaid';
import type { MakeReply } from '@ValenceDesktop/main/MakeReply';
import type { PasskeyCreationOptions } from '@ValenceContracts/schemas/PasskeyCreationOptions';
import { say } from '@ValenceI18n/say';

const MadeSchema = z.object({
  credentialId: z.instanceof(Buffer),
  attestationObject: z.instanceof(Buffer),
  transports: z.array(z.string()),
});

/**
 * Asks Windows to make a passkey for this account, over the given window, wherever the person
 * chooses to keep it — Windows Hello, a phone, a security key, or a passkey manager.
 *
 * @param window - The window the prompt belongs to, as Electron hands it over.
 * @param options - What the server asked for.
 * @param server - Where the server is.
 * @returns What was made, that somebody cancelled, or why it failed.
 */
const haveWindowsMakeAPasskey = async (
  window: Buffer,
  options: PasskeyCreationOptions,
  server: string,
): Promise<MakeReply> => {
  const make = theNativeModule().makeAPasskey;

  if (make === undefined) {
    return {
      kind: 'failed',
      reason: say('desktop.main.haveWindowsMakeAPasskey.thisBuildCannotAskWindowsTo'),
    };
  }

  const clientData = aClientData('webauthn.create', options.challenge, server);
  const selection = options.authenticatorSelection;

  try {
    const made = MadeSchema.parse(
      await make(window, {
        rpId: options.rp.id ?? new URL(server).hostname,
        rpName: options.rp.name,
        userId: Buffer.from(options.user.id, 'base64url'),
        userName: options.user.name,
        userDisplayName: options.user.displayName,
        clientDataJson: clientData,
        algorithms: options.pubKeyCredParams.map(({ alg }) => alg),
        exclude: (options.excludeCredentials ?? []).map(({ id }) => Buffer.from(id, 'base64url')),
        attachment: selection?.authenticatorAttachment ?? '',
        residentKey:
          selection?.residentKey ?? (selection?.requireResidentKey === true ? 'required' : ''),
        userVerification: selection?.userVerification ?? 'preferred',
        attestation: options.attestation ?? 'none',
        timeoutMs: options.timeout ?? PASSKEY_TIMEOUT,
      }),
    );
    const id = made.credentialId.toString('base64url');

    return {
      kind: 'done',
      done: {
        id,
        rawId: id,
        type: 'public-key',
        response: {
          clientDataJSON: Buffer.from(clientData).toString('base64url'),
          attestationObject: made.attestationObject.toString('base64url'),
          transports: made.transports,
        },
      },
    };
  } catch (error) {
    return whatWindowsSaid(error instanceof Error ? error : null);
  }
};

export { haveWindowsMakeAPasskey };
