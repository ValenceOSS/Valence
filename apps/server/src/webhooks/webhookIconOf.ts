/**
 * Where a webhook receiver can fetch Valence's mark to show beside a message, which is this server's
 * own icon at its public address. Only an address over https is given, since a receiver such as
 * Discord fetches the picture itself and cannot reach a server that is only on this network.
 *
 * @param address - The server's public address.
 * @returns The icon's address, or nothing where the server has no public one.
 */
const webhookIconOf = (address: string): string | null => {
  const parsed = URL.parse(address);

  return parsed?.protocol === 'https:' ? new URL('/icon.png', parsed).toString() : null;
};

export { webhookIconOf };
