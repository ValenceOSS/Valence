/**
 * Builds the address a linked server's request is passed through to, refusing where building it
 * would reach a different route from the one that was allowed.
 *
 * @param inner - The path of the route the request was allowed through to.
 * @param search - The request's query, with its leading `?`.
 * @param origin - This server's own origin.
 * @returns The address, or nothing where it would not be the route allowed.
 */
const innerAddressOf = (inner: string, search: string, origin: string): URL | null => {
  const address = new URL(`${inner}${search}`, origin);

  return address.pathname === inner ? address : null;
};

export { innerAddressOf };
