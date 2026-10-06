import { isIP } from 'node:net';

type ClientAddress = {
  headers: Headers;
  socketAddress: string | null;
  isTrustedProxy: (address: string) => boolean;
};

const IPV4_IN_IPV6 = '::ffff:';

/**
 * Writes an IPv4 address an IPv6 socket reported in its mapped form the way it is usually written.
 *
 * @param address - The address as it was given.
 * @returns The address, unwrapped where it was mapped.
 */
const unmapped = (address: string): string =>
  address.toLowerCase().startsWith(IPV4_IN_IPV6) && isIP(address.slice(IPV4_IN_IPV6.length)) === 4
    ? address.slice(IPV4_IN_IPV6.length)
    : address;

/**
 * Works out who is calling well enough to count their attempts against them: the connection
 * itself, unless that is a proxy this server trusts, in which case the last address in the
 * forwarded chain that is not one of its trusted proxies.
 *
 * Anybody can send `x-forwarded-for`, so a chain is read only from a trusted proxy, and only from
 * its end — each proxy appends the address it was reached from, while everything to the left of
 * the last trusted one is whatever the caller chose to write. Read from the front, a guesser would
 * name a fresh address on every attempt and never be counted twice.
 *
 * @param headers - What the caller sent.
 * @param socketAddress - Where the connection itself came from, where that is known.
 * @param isTrustedProxy - Whether an address is one of the proxies this server believes.
 * @returns The caller's address, or nothing where it cannot be told.
 */
const clientAddressOf = ({
  headers,
  socketAddress,
  isTrustedProxy,
}: ClientAddress): string | null => {
  if (socketAddress === null || isIP(unmapped(socketAddress)) === 0) {
    return null;
  }

  const socket = unmapped(socketAddress);

  if (!isTrustedProxy(socket)) {
    return socket;
  }

  const chain = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((hop) => unmapped(hop.trim()))
    .filter((hop) => hop !== '');

  for (const hop of [...chain].reverse()) {
    if (isIP(hop) === 0) {
      return null;
    }

    if (!isTrustedProxy(hop)) {
      return hop;
    }
  }

  return chain[0] ?? socket;
};

export type { ClientAddress };

export { clientAddressOf };
