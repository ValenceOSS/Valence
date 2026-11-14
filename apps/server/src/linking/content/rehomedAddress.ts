const A_PLAIN_FILE = /^(?!\.\.?(?:\?|$))[A-Za-z0-9._~-]+(?:\?[A-Za-z0-9._~=&%-]*)?$/u;

/**
 * Moves an address a linked server answered with onto this server's own route, refusing anything
 * that is not a plain file under the route it was expected under.
 *
 * @param address - What the linked server answered with.
 * @param from - The route the linked server's address must begin with.
 * @param to - The route on this server to put the file under.
 * @returns This server's address for the file, or nothing where the answer went anywhere else.
 */
const rehomedAddress = (address: string, from: string, to: string): string | null => {
  if (!address.startsWith(from)) {
    return null;
  }

  const file = address.slice(from.length);

  return A_PLAIN_FILE.test(file) ? `${to}${file}` : null;
};

export { rehomedAddress };
