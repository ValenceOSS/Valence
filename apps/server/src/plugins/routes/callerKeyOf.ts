import { isIPv6 } from 'node:net';

/**
 * Who a limit counts a caller as: their address, or for IPv6 the /64 network it is in, since one
 * caller can hold every address in it.
 *
 * @param address - Where the request came from, where that is known.
 * @returns The key the limit is kept under.
 */
const callerKeyOf = (address: string | null): string => {
  if (address === null) {
    return 'unknown';
  }

  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/iu)?.[1];

  if (mapped !== undefined) {
    return mapped;
  }

  if (!isIPv6(address)) {
    return address;
  }

  const [head = '', tail = ''] = address.split('::');
  const front = head === '' ? [] : head.split(':');
  const back = tail === '' ? [] : tail.split(':');
  const groups = address.includes('::')
    ? [...front, ...Array.from({ length: 8 - front.length - back.length }, () => '0'), ...back]
    : front;

  return `${groups
    .slice(0, 4)
    .map((group) => Number.parseInt(group, 16).toString(16))
    .join(':')}::/64`;
};

export { callerKeyOf };
