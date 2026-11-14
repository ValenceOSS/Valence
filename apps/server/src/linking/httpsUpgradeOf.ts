/**
 * Where a server that answered an http address with a redirect sends a request: only to the same
 * name over https, on the same port or the default one, and nowhere else.
 *
 * @param address - The http address that was asked.
 * @param location - The place the answer sent the request to.
 * @returns The https address, or nothing where it is anywhere else.
 */
const httpsUpgradeOf = (address: string, location: string | null): string | null => {
  const asked = URL.parse(address);
  const target = location === null ? null : URL.parse(location, address);

  return asked !== null &&
    target !== null &&
    asked.protocol === 'http:' &&
    target.protocol === 'https:' &&
    target.hostname === asked.hostname &&
    target.username === '' &&
    target.password === '' &&
    (target.port === '' || target.port === asked.port)
    ? target.href
    : null;
};

export { httpsUpgradeOf };
