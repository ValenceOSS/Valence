type CallerAddress = {
  headers: Headers;
  socketAddress: string | null;
};

const FORWARDED_FOR = 'x-forwarded-for';

const REAL_IP = 'x-real-ip';

const IPV4_IN_IPV6 = '::ffff:';

/**
 * Writes an address the way a person reads one.
 *
 * A socket listening on IPv6 reports an IPv4 caller in the mapped form — `::ffff:192.168.1.40` —
 * which is the same address wearing a hat. Somebody reading a notification wants the address they
 * would type.
 *
 * @param address - The address as it was given.
 * @returns The address, unwrapped where it was mapped.
 */
const plainly = (address: string): string =>
  address.toLowerCase().startsWith(IPV4_IN_IPV6) ? address.slice(IPV4_IN_IPV6.length) : address;

/**
 * Works out where a caller reached this server from.
 *
 * A reverse proxy is the usual answer, and `x-forwarded-for` carries the chain a request walked
 * through — the caller first, then each proxy that added itself on the way. Only the first entry is
 * the caller, so reading the header whole would report a list where a person expects an address.
 *
 * The socket is the fallback rather than the first answer, and it is the honest one where nothing
 * sits in front of this server: a machine reached straight across a home network has no proxy to be
 * forwarded by. It comes second because a server behind a proxy sees only the proxy there.
 *
 * Worth exactly as much trust as whatever is in front of this server, since anybody can send a
 * header. It says where somebody came from; it does not prove it.
 *
 * @param headers - What the caller sent.
 * @param socketAddress - Where the connection itself came from, where that is known.
 * @returns The address, or null where nothing said.
 */
const readCallerAddress = ({ headers, socketAddress }: CallerAddress): string | null => {
  const said = [headers.get(FORWARDED_FOR)?.split(',')[0], headers.get(REAL_IP), socketAddress]
    .map((one) => one?.trim() ?? '')
    .find((one) => one !== '');

  return said === undefined ? null : plainly(said);
};

export type { CallerAddress };

export { readCallerAddress };
