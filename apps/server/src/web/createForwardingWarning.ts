import { isIP } from 'node:net';

type ForwardingWarning = {
  isTrustedProxy: (address: string) => boolean;
  warn: (address: string) => void;
};

const REMEMBERED = 50;

const IPV4_IN_IPV6 = '::ffff:';

/**
 * Warns, once for each address, when a request says it was forwarded for somebody but came from an
 * address this server does not trust as a proxy. The forwarded address is ignored then, so a reverse
 * proxy left out of `TRUSTED_PROXIES` makes everybody behind it look like the proxy — in sign-in
 * notices, and to the sign-in rate limit, which they then share. The warning names the address to
 * add. Only so many addresses are remembered, so a caller sending the header from many addresses
 * cannot grow it without end.
 *
 * @param isTrustedProxy - Whether an address is one of the proxies this server believes.
 * @param warn - Told the address to warn of.
 * @returns What to tell of each request: its headers, and where its connection came from.
 */
const createForwardingWarning = ({ isTrustedProxy, warn }: ForwardingWarning) => {
  const warned = new Set<string>();

  return (headers: Headers, socketAddress: string | null): void => {
    const socket = socketAddress?.toLowerCase().startsWith(IPV4_IN_IPV6)
      ? socketAddress.slice(IPV4_IN_IPV6.length)
      : socketAddress;
    const isForwarded = headers.has('x-forwarded-for') || headers.has('x-real-ip');

    if (
      socket === null ||
      isIP(socket) === 0 ||
      !isForwarded ||
      isTrustedProxy(socket) ||
      warned.has(socket) ||
      warned.size >= REMEMBERED
    ) {
      return;
    }

    warned.add(socket);
    warn(socket);
  };
};

export { createForwardingWarning };
