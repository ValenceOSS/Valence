/**
 * The address a server found on the network answers at, from the host and port it was found at. An
 * IPv6 host goes in brackets, as an address needs it to; one with a zone, a link-local address only
 * this device's own network card can say, cannot be put in an address at all, and has none.
 *
 * @param host - The host, an IPv4 or IPv6 address or a name.
 * @param port - The port.
 * @returns The address, or null where the host cannot be reached by one.
 */
const addressOfAHost = (host: string, port: number): string | null => {
  if (!host.includes(':')) {
    return `http://${host}:${port.toString()}`;
  }

  return host.includes('%') ? null : `http://[${host}]:${port.toString()}`;
};

export { addressOfAHost };
