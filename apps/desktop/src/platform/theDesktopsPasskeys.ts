import { serverAddress } from '@ValenceClient/session/serverAddress';
import { swapTheHandBack } from '@ValenceClient/phone/swapTheHandBack';
import { aSecretAndItsChallenge } from '@ValenceDesktop/platform/aSecretAndItsChallenge';
import type { Passkeys } from '@ValenceClient/platform/Platform.types';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

type Reply<Done> =
  { kind: 'done'; done: Done } | { kind: 'cancelled' } | { kind: 'failed'; reason: string };

/**
 * Whether a server is somewhere a passkey can be used for at all: over HTTPS, or on this machine.
 *
 * @param address - Where the server is.
 * @returns Whether it is.
 */
const isSecure = (address: string): boolean => {
  const where = URL.canParse(address) ? new URL(address) : null;

  return where !== null && (where.protocol === 'https:' || LOOPBACK.has(where.hostname));
};

/**
 * Reads what the app's own process said about a passkey the way the application expects: what came
 * of it, nothing where somebody cancelled, and a throw with the reason where it failed.
 *
 * @param reply - What the process said.
 * @returns What came of it, or nothing.
 */
const whatCameOf = <Done>(reply: Reply<Done>): Done | null => {
  if (reply.kind === 'failed') {
    throw new Error(reply.reason);
  }

  return reply.kind === 'done' ? reply.done : null;
};

/**
 * How this desktop app does passkeys, which is never in the page: the window's address is this app's
 * own, and the browser engine will not use a passkey for the server from it.
 *
 * On Windows it asks Windows, which offers Windows Hello and whatever passkey managers have joined
 * it. On a Mac and on Linux it signs in on the server's own page in the person's own browser, with
 * whatever password manager it carries, and swaps the code handed back for a session here; passkeys
 * are added from the browser too. A server reached over plain HTTP gets none, since nothing will use a passkey for it.
 *
 * @returns This app's passkeys.
 */
const theDesktopsPasskeys = (): Passkeys => {
  const address = serverAddress();

  if (address !== null && !isSecure(address)) {
    return {
      kind: 'none',
      why: 'Passkeys need a secure connection. Reach Valence over HTTPS, or on localhost, to use one.',
    };
  }

  const { passkeys } = window.valence;

  if (passkeys.way === 'system') {
    return {
      kind: 'through-the-system',
      ask: async (options) => whatCameOf(await passkeys.ask(options)),
      make: async (options) => whatCameOf(await passkeys.make(options)),
    };
  }

  return {
    kind: 'through-a-sign-in-page',
    signIn: async (profileId) => {
      const { secret, challenge } = await aSecretAndItsChallenge();
      const reply = await passkeys.signInOnAPage(challenge, profileId);

      if (reply.kind !== 'done') {
        return reply.kind;
      }

      return (await swapTheHandBack(reply.done, secret)) ? 'in' : 'failed';
    },
    addOne: () => {
      passkeys.addOneInTheBrowser();
    },
  };
};

export { theDesktopsPasskeys };
