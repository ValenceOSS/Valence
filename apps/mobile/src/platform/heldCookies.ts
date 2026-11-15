import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';

const FRESH_FOR_MS = 60_000;

const ORIGIN = /^https?:\/\/[^/?#]*/iu;

const held = new Map<string, { header: string; readAt: number }>();

const asking = new Map<string, Promise<string | null>>();

const listeners = new Set<() => void>();

let forgottenTimes = 0;

/**
 * Tells everything drawing from the cookies that they have changed.
 */
const tellEveryone = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

/**
 * The cookies held for the server an address is on, read without waiting.
 *
 * @param address - Where something is about to be fetched from.
 * @returns The header to send, nothing where an address off the web needs none, or undefined where
 *   the jar has not been read for that server yet.
 */
const heldNow = (address: string): string | null | undefined => {
  const origin = ORIGIN.exec(address)?.[0];

  return origin === undefined ? null : held.get(origin.toLowerCase())?.header;
};

/**
 * Reads the jar for the server an address is on, unless it was read lately, keeping the answer for
 * every picture after it and telling those already drawn where it changed.
 *
 * @param address - Where something is about to be fetched from.
 * @returns The header to send, or nothing where the phone holds no cookies for that server.
 */
const askTheJar = (address: string): Promise<string | null> => {
  const origin = ORIGIN.exec(address)?.[0].toLowerCase();

  if (origin === undefined) {
    return Promise.resolve(null);
  }

  const kept = held.get(origin);

  if (kept !== undefined && Date.now() - kept.readAt < FRESH_FOR_MS) {
    return Promise.resolve(kept.header);
  }

  const already = asking.get(origin);

  if (already !== undefined) {
    return already;
  }

  const askedAt = forgottenTimes;
  const reading = theCookiesThisPhoneHolds(address)
    .catch(() => null)
    .then((header) => {
      if (askedAt !== forgottenTimes) {
        return header;
      }

      asking.delete(origin);

      const was = held.get(origin)?.header;

      if (header === null) {
        held.delete(origin);
      } else {
        held.set(origin, { header, readAt: Date.now() });
      }

      if (was !== (header ?? undefined)) {
        tellEveryone();
      }

      return header;
    });

  asking.set(origin, reading);

  return reading;
};

/**
 * Listens for the cookies held changing.
 *
 * @param listener - Told whenever they do.
 * @returns What stops it listening.
 */
const listen = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/**
 * Lets go of every cookie held, as signing out or into another account does, so the next picture
 * reads the jar again rather than sending a session that has ended.
 */
const forgetAll = (): void => {
  forgottenTimes += 1;
  held.clear();
  asking.clear();
  tellEveryone();
};

const heldCookies = { now: heldNow, ask: askTheJar, listen, forget: forgetAll };

export { heldCookies };
