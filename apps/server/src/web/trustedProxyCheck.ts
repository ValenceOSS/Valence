import { BlockList, isIP } from 'node:net';

/**
 * Makes a check for whether an address belongs to one of the proxies this server believes about
 * who is calling, from the ranges it was told to trust.
 *
 * A range that cannot be read stops the server at startup rather than being skipped, since a proxy
 * silently left out would see every caller reported as the proxy itself.
 *
 * @param ranges - Each range as an address with or without a `/` prefix length.
 * @returns Whether an address sits inside one of them.
 */
const trustedProxyCheck = (ranges: readonly string[]): ((address: string) => boolean) => {
  const trusted = new BlockList();

  for (const range of ranges) {
    const [address = '', length] = range.split('/');
    const family = isIP(address) === 6 ? 'ipv6' : 'ipv4';

    if (length === undefined) {
      trusted.addAddress(address, family);
    } else {
      trusted.addSubnet(address, Number(length), family);
    }
  }

  return (address) => {
    const family = isIP(address);

    return family !== 0 && trusted.check(address, family === 6 ? 'ipv6' : 'ipv4');
  };
};

export { trustedProxyCheck };
