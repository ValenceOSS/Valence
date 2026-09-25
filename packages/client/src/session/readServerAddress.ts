import { say } from '@ValenceI18n/say';

const SCHEMES = ['http://', 'https://'];

const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Reads what somebody typed as the address of a Valence server, or says why it is not one.
 *
 * Typing a bare host is what people do, so a missing scheme is filled in rather than refused. A
 * trailing slash is dropped because every path is joined onto this and two slashes reach nothing.
 *
 * @param typed - What they entered.
 * @returns The address to keep, or the reason it cannot be used.
 */
const readServerAddress = (typed: string): { address: string } | { problem: string } => {
  const trimmed = typed.trim();

  if (trimmed === '') {
    return { problem: say('client.readServerAddress.empty') };
  }

  if (
    ANY_SCHEME.test(trimmed) &&
    !SCHEMES.some((scheme) => trimmed.toLowerCase().startsWith(scheme))
  ) {
    return { problem: say('client.readServerAddress.scheme') };
  }

  const withScheme = ANY_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;

  const read = URL.parse(withScheme);

  if (read === null || read.hostname === '') {
    return { problem: say('client.readServerAddress.notAnAddress') };
  }

  if (!SCHEMES.includes(`${read.protocol}//`)) {
    return { problem: say('client.readServerAddress.scheme') };
  }

  return { address: `${read.origin}${read.pathname.replace(/\/+$/, '')}` };
};

export { readServerAddress };
