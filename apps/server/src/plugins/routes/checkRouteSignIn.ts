import { createHash, timingSafeEqual } from 'node:crypto';
import type { RouteSignIn } from '@ValenceSDK/manifest/RouteSignInSchema';
import type { CredentialRecord } from '@ValenceServer/plugins/store/PluginStore';
import { hashOfSecret } from './hashOfSecret';

type SignInAsked = {
  authorization: string | null;
  query: Readonly<Record<string, readonly string[]>>;
};

type CredentialLookups = {
  byLogin: (login: string) => Promise<CredentialRecord | null>;
  bySecret: (secretHash: string) => Promise<CredentialRecord | null>;
  open: (sealed: string) => string | null;
};

type SignedIn =
  | { kind: 'person'; credential: CredentialRecord }
  | { kind: 'nobody' }
  | { kind: 'refused' }
  | { kind: 'missing' };

/**
 * Whether two strings are the same, taking as long whatever they hold.
 *
 * @param left - One.
 * @param right - The other.
 * @returns Whether they match.
 */
const isSame = (left: string, right: string): boolean => {
  const a = Buffer.from(left, 'utf8');
  const b = Buffer.from(right, 'utf8');

  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Reads a secret that a client may send as hex after a prefix, as Subsonic's `enc:` does.
 *
 * @param value - What was sent.
 * @param hexPrefix - The prefix that says the rest is hex, where the route allows one.
 * @returns The secret.
 */
const plainSecret = (value: string, hexPrefix: string | undefined): string =>
  hexPrefix !== undefined &&
  value.startsWith(hexPrefix) &&
  /^[0-9a-f]*$/iu.test(value.slice(hexPrefix.length))
    ? Buffer.from(value.slice(hexPrefix.length), 'hex').toString('utf8')
    : value;

/**
 * Works out who a request to a plugin's route is from, by the first way the route accepts whose
 * parts the request carries.
 *
 * @param signIns - The ways the route accepts.
 * @param asked - What the request carries.
 * @param lookups - How to find and open the plugin's credentials.
 * @returns Who the request is from, or that it was refused or carried nothing.
 */
const checkRouteSignIn = async (
  signIns: readonly RouteSignIn[],
  asked: SignInAsked,
  lookups: CredentialLookups,
): Promise<SignedIn> => {
  const first = (name: string): string | undefined =>
    Object.hasOwn(asked.query, name) ? asked.query[name]?.[0] : undefined;
  const matching = (found: CredentialRecord | null, secret: string): SignedIn =>
    found !== null && isSame(found.secretHash, hashOfSecret(secret))
      ? { kind: 'person', credential: found }
      : { kind: 'refused' };
  let isOpen = false;

  for (const signIn of signIns) {
    switch (signIn.kind) {
      case 'public':
        isOpen = true;
        break;
      case 'bearer': {
        const token = asked.authorization?.match(/^Bearer (.+)$/iu)?.[1];

        if (token !== undefined) {
          return matching(await lookups.bySecret(hashOfSecret(token)), token);
        }

        break;
      }
      case 'basic': {
        const encoded = asked.authorization?.match(/^Basic ([A-Za-z0-9+/=]+)$/iu)?.[1];

        if (encoded !== undefined) {
          const decoded = Buffer.from(encoded, 'base64').toString('utf8');
          const split = decoded.indexOf(':');

          if (split < 1) {
            return { kind: 'refused' };
          }

          const secret = decoded.slice(split + 1);

          return matching(await lookups.byLogin(decoded.slice(0, split)), secret);
        }

        break;
      }
      case 'query': {
        const sent = first(signIn.secret);

        if (sent !== undefined) {
          const secret = plainSecret(sent, signIn.hexPrefix);

          if (signIn.login === undefined) {
            return matching(await lookups.bySecret(hashOfSecret(secret)), secret);
          }

          const login = first(signIn.login);

          return login === undefined
            ? { kind: 'refused' }
            : matching(await lookups.byLogin(login), secret);
        }

        break;
      }
      case 'saltedMd5': {
        const login = first(signIn.login);
        const token = first(signIn.token);
        const salt = first(signIn.salt);

        if (login !== undefined && token !== undefined && salt !== undefined) {
          const found = await lookups.byLogin(login);
          const secret = found === null ? null : lookups.open(found.sealedSecret);

          if (found === null || secret === null || salt.length < 6) {
            return { kind: 'refused' };
          }

          const expected = createHash('md5')
            .update(secret + salt, 'utf8')
            .digest('hex');

          return isSame(expected, token.toLowerCase())
            ? { kind: 'person', credential: found }
            : { kind: 'refused' };
        }

        break;
      }
    }
  }

  return isOpen ? { kind: 'nobody' } : { kind: 'missing' };
};

export type { CredentialLookups, SignInAsked, SignedIn };

export { checkRouteSignIn };
