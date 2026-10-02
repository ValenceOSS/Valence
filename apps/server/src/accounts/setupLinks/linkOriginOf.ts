/**
 * The address a setup link should open on: the web app the administrator is using, where that is
 * one this server trusts, so a link made from a browser opens where that browser does.
 *
 * @param headers - The request the link was asked for in.
 * @param trusted - The origins this server answers to.
 * @returns The origin to build the link on, or undefined to use the server's own address.
 */
const linkOriginOf = (headers: Headers, trusted: readonly string[]): string | undefined => {
  const origin = headers.get('origin');

  return origin !== null && origin.startsWith('http') && trusted.includes(origin)
    ? origin
    : undefined;
};

export { linkOriginOf };
